import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  increment,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { Message, Group, MessageFormData, Reply, ReplyFormData } from './types';
import { uploadMessageImage, compressImage } from './storage';

// Predefined popular groups
const POPULAR_GROUPS = ['Volunteers', 'Committees', 'Attendees', 'Everyone'];

// Pastel colors for message cards
const MESSAGE_COLORS = [
  '#FFE4E1', // Misty rose
  '#E6E6FA', // Lavender
  '#F0E68C', // Khaki
  '#E0FFFF', // Light cyan
  '#FFE4B5', // Moccasin
  '#F5DEB3', // Wheat
  '#DDA0DD', // Plum
  '#B0E0E6', // Powder blue
];

// Get a random color from the palette
const getRandomColor = () => {
  return MESSAGE_COLORS[Math.floor(Math.random() * MESSAGE_COLORS.length)];
};

// Get a message by ID
export const getMessage = async (messageId: string): Promise<Message | null> => {
  try {
    const messageRef = doc(db, 'messages', messageId);
    const messageSnap = await getDoc(messageRef);
    
    if (messageSnap.exists()) {
      return {
        id: messageSnap.id,
        ...messageSnap.data(),
      } as Message;
    }
    return null;
  } catch (error) {
    console.error('Error getting message:', error);
    return null;
  }
};

// Add a new message
export const addMessage = async (messageData: MessageFormData): Promise<void> => {
  let imageUrl: string | undefined;

  // Upload image if provided
  if (messageData.imageFile) {
    try {
      console.log('📤 Starting image upload process...');
      console.log(`📊 Original file size: ${(messageData.imageFile.size / 1024).toFixed(0)}KB`);
      
      // Compress the image before uploading
      const compressedImage = await compressImage(messageData.imageFile);
      console.log(`📊 After compression: ${(compressedImage.size / 1024).toFixed(0)}KB`);
      
      // Upload (timeout is handled within uploadMessageImage)
      console.log('☁️ Uploading to Firebase Storage...');
      imageUrl = await uploadMessageImage(compressedImage);
      console.log('✅ Image uploaded successfully!');
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      
      // Provide more specific error message
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw new Error('Image upload timed out. Please check your internet connection and try with a smaller image.');
        } else if (error.message.includes('retry-limit-exceeded')) {
          throw new Error('Upload failed after multiple retries. Please check your internet connection and try again.');
        } else if (error.message.includes('Permission denied')) {
          throw new Error('Upload failed: Permission denied. Please contact the administrator.');
        }
        throw error;
      }
      throw new Error('Failed to upload image. Please try again.');
    }
  }

  try {
    // If reposting, fetch the original message content
    let content = messageData.content;
    let originalImageUrl = undefined;
    
    if (messageData.repostedFrom) {
      const originalMessage = await getMessage(messageData.repostedFrom);
      if (originalMessage) {
        content = originalMessage.content;
        originalImageUrl = originalMessage.imageUrl;
      } else {
        throw new Error('Original message not found');
      }
    }

    const message = {
      from: messageData.from || 'Anonymous',
      to: messageData.to,
      content: content,
      timestamp: Timestamp.now(),
      color: getRandomColor(),
      likes: 0,
      ...(imageUrl && { imageUrl }), // Use new image if provided
      ...(originalImageUrl && !imageUrl && { imageUrl: originalImageUrl }), // Use original image if reposting and no new image
      ...(messageData.repostedFrom && { repostedFrom: messageData.repostedFrom }),
      ...(messageData.repostComment && { repostComment: messageData.repostComment }),
    };

    await addDoc(collection(db, 'messages'), message);

    // Update or create groups
    for (const recipient of messageData.to) {
      const groupId = recipient.toLowerCase();
      const groupRef = doc(db, 'groups', groupId);
      
      try {
        await updateDoc(groupRef, {
          messageCount: increment(1),
        });
      } catch (error) {
        // Group doesn't exist, create it
        await setDoc(groupRef, {
          id: groupId,
          displayName: recipient,
          createdAt: Timestamp.now(),
          messageCount: 1,
        });
      }
    }
  } catch (error) {
    console.error('Error saving message to Firestore:', error);
    throw new Error('Failed to save message. Please try again.');
  }
};

// Like a message
export const likeMessage = async (messageId: string): Promise<void> => {
  const messageRef = doc(db, 'messages', messageId);
  await updateDoc(messageRef, {
    likes: increment(1),
  });
};

// Subscribe to messages in real-time
export const subscribeToMessages = (
  callback: (messages: Message[]) => void,
  filter?: string
): (() => void) => {
  let q;
  
  if (filter && filter !== 'all') {
    // When filtering, fetch without orderBy to avoid requiring a composite index
    // We'll sort in memory instead
    q = query(
      collection(db, 'messages'),
      where('to', 'array-contains', filter)
    );
  } else {
    q = query(collection(db, 'messages'), orderBy('timestamp', 'desc'));
  }

  const unsubscribe = onSnapshot(q, (snapshot) => {
    let messages: Message[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Message[];
    
    // Sort by timestamp descending if we didn't use orderBy in the query
    if (filter && filter !== 'all') {
      messages.sort((a, b) => {
        const aTime = a.timestamp?.toMillis() || 0;
        const bTime = b.timestamp?.toMillis() || 0;
        return bTime - aTime;
      });
    }
    
    callback(messages);
  });

  return unsubscribe;
};

// Get all groups
export const getGroups = async (): Promise<Group[]> => {
  const q = query(collection(db, 'groups'), orderBy('messageCount', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as Group);
};

// Subscribe to groups in real-time
export const subscribeToGroups = (
  callback: (groups: Group[]) => void
): (() => void) => {
  const q = query(collection(db, 'groups'), orderBy('messageCount', 'desc'));
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const groups: Group[] = snapshot.docs.map((doc) => doc.data() as Group);
    callback(groups);
  });

  return unsubscribe;
};

// Initialize popular groups if they don't exist
export const initializePopularGroups = async (): Promise<void> => {
  for (const groupName of POPULAR_GROUPS) {
    const groupId = groupName.toLowerCase();
    const groupRef = doc(db, 'groups', groupId);
    
    try {
      await setDoc(groupRef, {
        id: groupId,
        displayName: groupName,
        createdAt: Timestamp.now(),
        messageCount: 0,
      }, { merge: true }); // Use merge to not overwrite existing data
    } catch (error) {
      console.error('Error initializing group:', groupName, error);
    }
  }
};

// Add a reply to a message
export const addReply = async (messageId: string, replyData: ReplyFormData): Promise<void> => {
  try {
    const reply = {
      from: replyData.from || 'Anonymous',
      content: replyData.content,
      timestamp: Timestamp.now(),
    };

    const repliesRef = collection(db, 'messages', messageId, 'replies');
    await addDoc(repliesRef, reply);
  } catch (error) {
    console.error('Error saving reply to Firestore:', error);
    throw new Error('Failed to save reply. Please try again.');
  }
};

// Subscribe to replies for a message in real-time
export const subscribeToReplies = (
  messageId: string,
  callback: (replies: Reply[]) => void
): (() => void) => {
  const repliesRef = collection(db, 'messages', messageId, 'replies');
  const q = query(repliesRef, orderBy('timestamp', 'asc'));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const replies: Reply[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Reply[];
    
    callback(replies);
  });

  return unsubscribe;
};


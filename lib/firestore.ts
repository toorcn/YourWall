import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  increment,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { Message, Group, MessageFormData } from './types';

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

// Add a new message
export const addMessage = async (messageData: MessageFormData): Promise<void> => {
  const message = {
    from: messageData.from || 'Anonymous',
    to: messageData.to,
    content: messageData.content,
    timestamp: Timestamp.now(),
    color: getRandomColor(),
    likes: 0,
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


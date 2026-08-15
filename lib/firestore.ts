import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  getDoc,
  doc,
  setDoc,
  where,
  limit,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db, ensureAnonymousAuth } from './firebase';
import { Message, MessageFormData, Reply, ReplyFormData, Space, SpaceFormData } from './types';
import { compressImage, uploadMessageImage } from './storage';

// Predefined popular groups
const POPULAR_GROUPS = ['General', 'Shoutouts', 'Q&A'];

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

// ==================== SPACE MANAGEMENT FUNCTIONS ====================

// Validate space code format and availability
export const validateSpaceCode = async (code: string): Promise<{ valid: boolean; available?: boolean; error?: string }> => {
  // Validate format: alphanumeric, lowercase, 3-20 characters
  const codeRegex = /^[a-z0-9]{3,20}$/;

  if (!code || code.trim().length === 0) {
    return { valid: false, error: 'Space code is required' };
  }

  const normalizedCode = code.toLowerCase().trim();

  if (!codeRegex.test(normalizedCode)) {
    return {
      valid: false,
      error: 'Space code must be 3-20 characters, lowercase letters and numbers only (no spaces or special characters)'
    };
  }

  // Check if code already exists
  try {
    const spaceRef = doc(db, 'spaces', normalizedCode);
    const spaceSnap = await getDoc(spaceRef);

    if (spaceSnap.exists()) {
      return { valid: true, available: false, error: 'This space code is already taken' };
    }

    return { valid: true, available: true };
  } catch (error) {
    console.error('Error validating space code:', error);
    return { valid: false, error: 'Failed to validate space code. Please try again.' };
  }
};

// Find a unique space code by appending numbers if necessary
export const getUniqueSpaceCode = async (baseCode: string): Promise<string> => {
  const normalizedBase = baseCode.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

  // Basic validation - if empty or too short, return as is (component will handle validation)
  if (normalizedBase.length < 3) return normalizedBase;

  let currentCode = normalizedBase.substring(0, 20);
  let counter = 1;

  while (true) {
    const spaceRef = doc(db, 'spaces', currentCode);
    const spaceSnap = await getDoc(spaceRef);

    if (!spaceSnap.exists()) {
      return currentCode;
    }

    // Code exists, try next one
    const suffix = counter.toString();
    const remainingLength = 20 - suffix.length;
    currentCode = normalizedBase.substring(0, remainingLength) + suffix;
    counter++;

    // Safety break
    if (counter > 100) return currentCode;
  }
};

// Get space by code
export const getSpaceByCode = async (code: string): Promise<Space | null> => {
  try {
    const normalizedCode = code.toLowerCase().trim();
    const spaceRef = doc(db, 'spaces', normalizedCode);
    const spaceSnap = await getDoc(spaceRef);

    if (spaceSnap.exists()) {
      return {
        code: spaceSnap.id,
        ...spaceSnap.data(),
      } as Space;
    }
    return null;
  } catch (error) {
    console.error('Error getting space:', error);
    return null;
  }
};

// Create a new space
export const createSpace = async (spaceData: SpaceFormData): Promise<void> => {
  try {
    const normalizedCode = spaceData.code.toLowerCase().trim();
    const user = await ensureAnonymousAuth();

    // Validate code
    const validation = await validateSpaceCode(normalizedCode);
    if (!validation.valid || !validation.available) {
      throw new Error(validation.error || 'Invalid or unavailable space code');
    }

    const space = {
      title: spaceData.title.trim(),
      colors: spaceData.colors,
      popularGroups: spaceData.popularGroups.length > 0 ? spaceData.popularGroups : POPULAR_GROUPS,
      imagesEnabled: false,
      createdAt: serverTimestamp(),
      ownerUid: user.uid,
      stats: {
        messageCount: 0,
        groupCount: 0,
        totalLikes: 0,
      },
      // Only include optional fields if they have values
      ...(spaceData.description?.trim() && { description: spaceData.description.trim() }),
    };

    const spaceRef = doc(db, 'spaces', normalizedCode);
    await setDoc(spaceRef, space);
  } catch (error) {
    console.error('Error creating space:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create space. Please try again.');
  }
};

// Get a message by ID (requires spaceCode for validation)
export const getMessage = async (messageId: string, spaceCode: string): Promise<Message | null> => {
  try {
    const messageRef = doc(db, 'messages', messageId);
    const messageSnap = await getDoc(messageRef);

    if (messageSnap.exists()) {
      const messageData = messageSnap.data() as Message;
      // Verify message belongs to the space
      if (messageData.spaceCode !== spaceCode.toLowerCase().trim()) {
        return null;
      }
      const { id: _, ...messageWithoutId } = messageData;
      return {
        id: messageSnap.id,
        ...messageWithoutId,
      } as Message;
    }
    return null;
  } catch (error) {
    console.error('Error getting message:', error);
    return null;
  }
};

// Add a new message
export const addMessage = async (messageData: MessageFormData, spaceCode: string): Promise<void> => {
  const normalizedSpaceCode = spaceCode.toLowerCase().trim();

  try {
    const user = await ensureAnonymousAuth();
    let imageUrl: string | undefined;

    if (messageData.imageFile) {
      const space = await getSpaceByCode(normalizedSpaceCode);
      if (space?.imagesEnabled !== true) {
        throw new Error('Image uploads are not enabled for this space.');
      }

      const compressedImage = await compressImage(messageData.imageFile);
      imageUrl = await uploadMessageImage(compressedImage, normalizedSpaceCode);
    }

    // If reposting, fetch the original message content
    let content = messageData.content;

    if (messageData.repostedFrom) {
      const originalMessage = await getMessage(messageData.repostedFrom, normalizedSpaceCode);
      if (originalMessage) {
        content = originalMessage.content;
      } else {
        throw new Error('Original message not found');
      }
    }

    const message = {
      from: messageData.from.trim() || 'Anonymous',
      to: messageData.to.map((recipient) => recipient.trim()),
      content: content.trim(),
      timestamp: serverTimestamp(),
      color: getRandomColor(),
      likes: 0,
      spaceCode: normalizedSpaceCode,
      authorUid: user.uid,
      ...(imageUrl && { imageUrl }),
      ...(messageData.repostedFrom && { repostedFrom: messageData.repostedFrom }),
      ...(messageData.repostComment?.trim() && { repostComment: messageData.repostComment.trim() }),
    };

    await addDoc(collection(db, 'messages'), message);
  } catch (error) {
    console.error('Error saving message to Firestore:', error);
    throw new Error('Failed to save message. Please try again.');
  }
};

// Like a message
export const likeMessage = async (messageId: string, spaceCode: string): Promise<void> => {
  const normalizedSpaceCode = spaceCode.toLowerCase().trim();
  const user = await ensureAnonymousAuth();
  const messageRef = doc(db, 'messages', messageId);
  const likeRef = doc(db, 'messages', messageId, 'likes', user.uid);

  await runTransaction(db, async (transaction) => {
    const [messageSnap, likeSnap] = await Promise.all([
      transaction.get(messageRef),
      transaction.get(likeRef),
    ]);

    if (!messageSnap.exists() || messageSnap.data().spaceCode !== normalizedSpaceCode) {
      throw new Error('Message does not belong to this space');
    }
    if (likeSnap.exists()) return;

    const likes = Math.max(0, Number(messageSnap.data().likes) || 0);
    transaction.update(messageRef, { likes: likes + 1 });
    transaction.set(likeRef, {
      userId: user.uid,
      createdAt: serverTimestamp(),
    });
  });
};

// Unlike a message
export const unlikeMessage = async (messageId: string, spaceCode: string): Promise<void> => {
  const normalizedSpaceCode = spaceCode.toLowerCase().trim();
  const user = await ensureAnonymousAuth();
  const messageRef = doc(db, 'messages', messageId);
  const likeRef = doc(db, 'messages', messageId, 'likes', user.uid);

  await runTransaction(db, async (transaction) => {
    const [messageSnap, likeSnap] = await Promise.all([
      transaction.get(messageRef),
      transaction.get(likeRef),
    ]);

    if (!messageSnap.exists() || messageSnap.data().spaceCode !== normalizedSpaceCode) {
      throw new Error('Message does not belong to this space');
    }
    if (!likeSnap.exists()) return;

    const likes = Math.max(0, Number(messageSnap.data().likes) || 0);
    transaction.update(messageRef, { likes: Math.max(0, likes - 1) });
    transaction.delete(likeRef);
  });
};

export const hasLikedMessage = async (messageId: string): Promise<boolean> => {
  const user = await ensureAnonymousAuth();
  return (await getDoc(doc(db, 'messages', messageId, 'likes', user.uid))).exists();
};

// Subscribe to messages in real-time (scoped to space)
export const subscribeToMessages = (
  spaceCode: string,
  callback: (messages: Message[]) => void,
  filter?: string,
  onError?: (error: Error) => void
): (() => void) => {
  const normalizedSpaceCode = spaceCode.toLowerCase().trim();
  let q;

  if (filter && filter !== 'all') {
    // When filtering, fetch without orderBy to avoid requiring a composite index
    // We'll sort in memory instead
    q = query(
      collection(db, 'messages'),
      where('spaceCode', '==', normalizedSpaceCode),
      where('to', 'array-contains', filter),
      limit(200)
    );
  } else {
    q = query(
      collection(db, 'messages'),
      where('spaceCode', '==', normalizedSpaceCode),
      orderBy('timestamp', 'desc'),
      limit(200)
    );
  }

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const messages: Message[] = snapshot.docs.map((doc) => ({
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
    },
    (error) => {
      console.error('Error loading messages:', error);
      onError?.(error);
    }
  );

  return unsubscribe;
};

// Add a reply to a message
export const addReply = async (messageId: string, replyData: ReplyFormData): Promise<void> => {
  try {
    const user = await ensureAnonymousAuth();
    const reply = {
      from: replyData.from.trim() || 'Anonymous',
      content: replyData.content.trim(),
      timestamp: serverTimestamp(),
      authorUid: user.uid,
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
  const q = query(repliesRef, orderBy('timestamp', 'asc'), limit(100));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const replies: Reply[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Reply[];

    callback(replies);
  });

  return unsubscribe;
};

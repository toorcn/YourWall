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
import { Message, Group, MessageFormData, Reply, ReplyFormData, Space, SpaceFormData } from './types';

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

    // Validate code
    const validation = await validateSpaceCode(normalizedCode);
    if (!validation.valid || !validation.available) {
      throw new Error(validation.error || 'Invalid or unavailable space code');
    }

    const space: Omit<Space, 'code'> = {
      title: spaceData.title,
      colors: spaceData.colors,
      popularGroups: spaceData.popularGroups.length > 0 ? spaceData.popularGroups : POPULAR_GROUPS,
      createdAt: Timestamp.now(),
      stats: {
        messageCount: 0,
        groupCount: 0,
        totalLikes: 0,
      },
      // Only include optional fields if they have values
      ...(spaceData.description && { description: spaceData.description }),
      ...(spaceData.createdBy && { createdBy: spaceData.createdBy }),
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

// Update space statistics
export const updateSpaceStats = async (
  spaceCode: string,
  updates: { messageCount?: number; groupCount?: number; totalLikes?: number }
): Promise<void> => {
  try {
    const normalizedCode = spaceCode.toLowerCase().trim();
    const spaceRef = doc(db, 'spaces', normalizedCode);

    const statsUpdate: Record<string, number> = {};
    if (updates.messageCount !== undefined) {
      statsUpdate['stats.messageCount'] = updates.messageCount;
    }
    if (updates.groupCount !== undefined) {
      statsUpdate['stats.groupCount'] = updates.groupCount;
    }
    if (updates.totalLikes !== undefined) {
      statsUpdate['stats.totalLikes'] = updates.totalLikes;
    }

    // Firestore doesn't support nested field updates with dot notation in updateDoc
    // We need to get the current stats and update them
    const spaceSnap = await getDoc(spaceRef);
    if (spaceSnap.exists()) {
      const currentData = spaceSnap.data() as Space;
      const currentStats = currentData.stats || { messageCount: 0, groupCount: 0, totalLikes: 0 };

      await updateDoc(spaceRef, {
        stats: {
          messageCount: updates.messageCount ?? currentStats.messageCount,
          groupCount: updates.groupCount ?? currentStats.groupCount,
          totalLikes: updates.totalLikes ?? currentStats.totalLikes,
        },
      });
    }
  } catch (error) {
    console.error('Error updating space stats:', error);
    // Don't throw - stats updates are non-critical
  }
};

// Increment space statistics (helper for analytics)
export const incrementSpaceStats = async (
  spaceCode: string,
  increments: { messageCount?: number; groupCount?: number; totalLikes?: number }
): Promise<void> => {
  try {
    const normalizedCode = spaceCode.toLowerCase().trim();
    const spaceRef = doc(db, 'spaces', normalizedCode);

    const statsUpdate: Record<string, ReturnType<typeof increment>> = {};
    if (increments.messageCount !== undefined) {
      statsUpdate['stats.messageCount'] = increment(increments.messageCount);
    }
    if (increments.groupCount !== undefined) {
      statsUpdate['stats.groupCount'] = increment(increments.groupCount);
    }
    if (increments.totalLikes !== undefined) {
      statsUpdate['stats.totalLikes'] = increment(increments.totalLikes);
    }

    // Firestore doesn't support nested field increments directly
    // We need to get the current stats and update them
    const spaceSnap = await getDoc(spaceRef);
    if (spaceSnap.exists()) {
      const currentData = spaceSnap.data() as Space;
      const currentStats = currentData.stats || { messageCount: 0, groupCount: 0, totalLikes: 0 };

      await updateDoc(spaceRef, {
        stats: {
          messageCount: currentStats.messageCount + (increments.messageCount || 0),
          groupCount: currentStats.groupCount + (increments.groupCount || 0),
          totalLikes: currentStats.totalLikes + (increments.totalLikes || 0),
        },
      });
    }
  } catch (error) {
    console.error('Error incrementing space stats:', error);
    // Don't throw - stats updates are non-critical
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
      from: messageData.from || 'Anonymous',
      to: messageData.to,
      content: content,
      timestamp: Timestamp.now(),
      color: getRandomColor(),
      likes: 0,
      spaceCode: normalizedSpaceCode,
      ...(messageData.repostedFrom && { repostedFrom: messageData.repostedFrom }),
      ...(messageData.repostComment && { repostComment: messageData.repostComment }),
    };

    await addDoc(collection(db, 'messages'), message);

    // Update or create groups (scoped to space)
    let newGroupsCount = 0;
    for (const recipient of messageData.to) {
      const groupId = `${normalizedSpaceCode}_${recipient.toLowerCase()}`;
      const groupRef = doc(db, 'groups', groupId);

      try {
        await updateDoc(groupRef, {
          messageCount: increment(1),
        });
      } catch {
        // Group doesn't exist, create it
        await setDoc(groupRef, {
          id: groupId,
          displayName: recipient,
          createdAt: Timestamp.now(),
          messageCount: 1,
          spaceCode: normalizedSpaceCode,
        });
        newGroupsCount++;
      }
    }

    // Update space stats
    await incrementSpaceStats(normalizedSpaceCode, {
      messageCount: 1,
      groupCount: newGroupsCount,
    });
  } catch (error) {
    console.error('Error saving message to Firestore:', error);
    throw new Error('Failed to save message. Please try again.');
  }
};

// Like a message
export const likeMessage = async (messageId: string, spaceCode: string): Promise<void> => {
  const normalizedSpaceCode = spaceCode.toLowerCase().trim();
  const messageRef = doc(db, 'messages', messageId);

  // Verify message belongs to space before updating
  const messageSnap = await getDoc(messageRef);
  if (messageSnap.exists()) {
    const messageData = messageSnap.data() as Message;
    if (messageData.spaceCode !== normalizedSpaceCode) {
      throw new Error('Message does not belong to this space');
    }
  }

  await updateDoc(messageRef, {
    likes: increment(1),
  });

  // Update space stats
  await incrementSpaceStats(normalizedSpaceCode, {
    totalLikes: 1,
  });
};

// Unlike a message
export const unlikeMessage = async (messageId: string, spaceCode: string): Promise<void> => {
  const normalizedSpaceCode = spaceCode.toLowerCase().trim();
  const messageRef = doc(db, 'messages', messageId);

  // Verify message belongs to space before updating
  const messageSnap = await getDoc(messageRef);
  if (messageSnap.exists()) {
    const messageData = messageSnap.data() as Message;
    if (messageData.spaceCode !== normalizedSpaceCode) {
      throw new Error('Message does not belong to this space');
    }
  }

  await updateDoc(messageRef, {
    likes: increment(-1),
  });

  // Update space stats
  await incrementSpaceStats(normalizedSpaceCode, {
    totalLikes: -1,
  });
};

// Subscribe to messages in real-time (scoped to space)
export const subscribeToMessages = (
  spaceCode: string,
  callback: (messages: Message[]) => void,
  filter?: string
): (() => void) => {
  const normalizedSpaceCode = spaceCode.toLowerCase().trim();
  let q;

  if (filter && filter !== 'all') {
    // When filtering, fetch without orderBy to avoid requiring a composite index
    // We'll sort in memory instead
    q = query(
      collection(db, 'messages'),
      where('spaceCode', '==', normalizedSpaceCode),
      where('to', 'array-contains', filter)
    );
  } else {
    q = query(
      collection(db, 'messages'),
      where('spaceCode', '==', normalizedSpaceCode),
      orderBy('timestamp', 'desc')
    );
  }

  const unsubscribe = onSnapshot(q, (snapshot) => {
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
  });

  return unsubscribe;
};

// Get all groups (scoped to space)
export const getGroups = async (spaceCode: string): Promise<Group[]> => {
  const normalizedSpaceCode = spaceCode.toLowerCase().trim();
  const q = query(
    collection(db, 'groups'),
    where('spaceCode', '==', normalizedSpaceCode),
    orderBy('messageCount', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as Group);
};

// Subscribe to groups in real-time (scoped to space)
export const subscribeToGroups = (
  spaceCode: string,
  callback: (groups: Group[]) => void
): (() => void) => {
  const normalizedSpaceCode = spaceCode.toLowerCase().trim();
  const q = query(
    collection(db, 'groups'),
    where('spaceCode', '==', normalizedSpaceCode),
    orderBy('messageCount', 'desc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const groups: Group[] = snapshot.docs.map((doc) => doc.data() as Group);
    callback(groups);
  });

  return unsubscribe;
};

// Initialize popular groups if they don't exist (scoped to space)
export const initializePopularGroups = async (spaceCode: string, popularGroups?: string[]): Promise<void> => {
  const normalizedSpaceCode = spaceCode.toLowerCase().trim();
  const groupsToInitialize = popularGroups && popularGroups.length > 0 ? popularGroups : POPULAR_GROUPS;

  for (const groupName of groupsToInitialize) {
    const groupId = `${normalizedSpaceCode}_${groupName.toLowerCase()}`;
    const groupRef = doc(db, 'groups', groupId);

    try {
      await setDoc(groupRef, {
        id: groupId,
        displayName: groupName,
        createdAt: Timestamp.now(),
        messageCount: 0,
        spaceCode: normalizedSpaceCode,
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


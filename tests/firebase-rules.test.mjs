import { readFile } from 'node:fs/promises';
import {
  after,
  before,
  beforeEach,
  describe,
  test,
} from 'node:test';
import assert from 'node:assert/strict';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  getBytes,
  ref,
  uploadBytes,
} from 'firebase/storage';

const projectId = 'demo-yourwall';
let testEnv;

const validSpace = (uid = 'alice') => ({
  title: 'Demo Space',
  colors: {
    primary: '#6366f1',
    secondary: '#f43f5e',
    accent: '#a855f7',
  },
  popularGroups: ['General', 'Shoutouts', 'Q&A'],
  imagesEnabled: false,
  createdAt: serverTimestamp(),
  ownerUid: uid,
  stats: {
    messageCount: 0,
    groupCount: 0,
    totalLikes: 0,
  },
});

const validMessage = (uid = 'alice') => ({
  from: 'Anonymous',
  to: ['Everyone'],
  content: 'A secure wall message',
  timestamp: serverTimestamp(),
  color: '#FFE4E1',
  likes: 0,
  spaceCode: 'demo',
  authorUid: uid,
});

async function seedSpaceAndMessage() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'spaces', 'demo'), validSpace());
    await setDoc(doc(db, 'messages', 'message-1'), validMessage());
  });
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8'),
    },
    storage: {
      rules: await readFile(new URL('../storage.rules', import.meta.url), 'utf8'),
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.clearStorage();
});

after(async () => {
  await testEnv.cleanup();
});

describe('Cloud Firestore rules', () => {
  test('public reads work, while unbounded collection reads are denied', async () => {
    await seedSpaceAndMessage();
    const db = testEnv.unauthenticatedContext().firestore();

    await assertSucceeds(getDoc(doc(db, 'spaces', 'demo')));
    await assertFails(getDocs(collection(db, 'spaces')));

    const boundedMessages = query(
      collection(db, 'messages'),
      where('spaceCode', '==', 'demo'),
      orderBy('timestamp', 'desc'),
      limit(200),
    );
    await assertSucceeds(getDocs(boundedMessages));
    await assertFails(getDocs(collection(db, 'messages')));
  });

  test('space creation requires auth, ownership, and a strict schema', async () => {
    const guestDb = testEnv.unauthenticatedContext().firestore();
    const aliceDb = testEnv.authenticatedContext('alice').firestore();

    await assertFails(setDoc(doc(guestDb, 'spaces', 'guest'), validSpace('guest')));
    await assertSucceeds(setDoc(doc(aliceDb, 'spaces', 'alicewall'), validSpace('alice')));
    const { imagesEnabled: _, ...legacySpace } = validSpace('alice');
    await assertSucceeds(setDoc(doc(aliceDb, 'spaces', 'legacywall'), legacySpace));
    await assertFails(setDoc(doc(aliceDb, 'spaces', 'wrongowner'), validSpace('mallory')));
    await assertFails(setDoc(doc(aliceDb, 'spaces', 'bad-extra'), {
      ...validSpace('alice'),
      isAdmin: true,
    }));
  });

  test('message and reply writes require auth and validated content', async () => {
    await seedSpaceAndMessage();
    const guestDb = testEnv.unauthenticatedContext().firestore();
    const aliceDb = testEnv.authenticatedContext('alice').firestore();

    await assertFails(setDoc(doc(guestDb, 'messages', 'guest-message'), validMessage('guest')));
    await assertSucceeds(setDoc(doc(aliceDb, 'messages', 'alice-message'), validMessage('alice')));
    await assertFails(setDoc(doc(aliceDb, 'messages', 'too-short'), {
      ...validMessage('alice'),
      content: 'short',
    }));

    const replyRef = doc(aliceDb, 'messages', 'message-1', 'replies', 'reply-1');
    await assertSucceeds(setDoc(replyRef, {
      from: 'Alice',
      content: 'Thanks!',
      timestamp: serverTimestamp(),
      authorUid: 'alice',
    }));
    await assertFails(updateDoc(replyRef, { content: 'Changed later' }));
  });

  test('image messages require images to be enabled for the space', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'spaces', 'imageson'), {
        ...validSpace(),
        imagesEnabled: true,
      });
    });

    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    const imageUrl = 'https://firebasestorage.googleapis.com/v0/b/demo/o/message.png';

    await assertSucceeds(setDoc(doc(aliceDb, 'messages', 'image-message'), {
      ...validMessage('alice'),
      spaceCode: 'imageson',
      imageUrl,
    }));
    await assertFails(setDoc(doc(aliceDb, 'messages', 'disabled-image-message'), {
      ...validMessage('alice'),
      imageUrl,
    }));
    await assertFails(setDoc(doc(aliceDb, 'messages', 'external-image-message'), {
      ...validMessage('alice'),
      spaceCode: 'imageson',
      imageUrl: 'https://example.com/image.png',
    }));
  });

  test('likes require one matching per-user document in an atomic transaction', async () => {
    await seedSpaceAndMessage();
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    const messageRef = doc(aliceDb, 'messages', 'message-1');
    const likeRef = doc(aliceDb, 'messages', 'message-1', 'likes', 'alice');

    await assertFails(updateDoc(messageRef, { likes: 1 }));
    await assertFails(setDoc(likeRef, {
      userId: 'alice',
      createdAt: serverTimestamp(),
    }));

    await assertSucceeds(runTransaction(aliceDb, async (transaction) => {
      const message = await transaction.get(messageRef);
      await transaction.get(likeRef);
      transaction.update(messageRef, { likes: message.data().likes + 1 });
      transaction.set(likeRef, {
        userId: 'alice',
        createdAt: serverTimestamp(),
      });
    }));

    assert.equal((await getDoc(messageRef)).data().likes, 1);
    assert.equal((await getDoc(likeRef)).exists(), true);

    await assertSucceeds(runTransaction(aliceDb, async (transaction) => {
      const message = await transaction.get(messageRef);
      await transaction.get(likeRef);
      transaction.update(messageRef, { likes: message.data().likes - 1 });
      transaction.delete(likeRef);
    }));

    assert.equal((await getDoc(messageRef)).data().likes, 0);
    assert.equal((await getDoc(likeRef)).exists(), false);
  });

  test('legacy group counter documents cannot be changed by clients', async () => {
    const db = testEnv.authenticatedContext('alice').firestore();
    await assertFails(setDoc(doc(db, 'groups', 'demo_general'), {
      displayName: 'General',
      messageCount: 999,
      spaceCode: 'demo',
    }));
  });
});

describe('Cloud Storage rules', () => {
  test('images are public, but only authenticated users can upload to their uid path', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'spaces', 'imageson'), {
        ...validSpace(),
        imagesEnabled: true,
      });
      await setDoc(doc(db, 'spaces', 'imagesoff'), validSpace());
    });

    const bytes = new Uint8Array([137, 80, 78, 71]);
    const aliceStorage = testEnv.authenticatedContext('alice').storage();
    const guestStorage = testEnv.unauthenticatedContext().storage();

    const imageRef = ref(aliceStorage, 'message-images/imageson/alice/photo.png');
    await assertSucceeds(uploadBytes(imageRef, bytes, { contentType: 'image/png' }));
    await assertSucceeds(getBytes(ref(guestStorage, 'message-images/imageson/alice/photo.png')));

    await assertFails(uploadBytes(
      ref(guestStorage, 'message-images/imageson/guest/photo.png'),
      bytes,
      { contentType: 'image/png' },
    ));
    await assertFails(uploadBytes(
      ref(aliceStorage, 'message-images/imageson/mallory/photo.png'),
      bytes,
      { contentType: 'image/png' },
    ));
    await assertFails(uploadBytes(
      ref(aliceStorage, 'message-images/imageson/alice/file.svg'),
      bytes,
      { contentType: 'image/svg+xml' },
    ));
    await assertFails(uploadBytes(
      ref(aliceStorage, 'message-images/imagesoff/alice/photo.png'),
      bytes,
      { contentType: 'image/png' },
    ));
  });
});

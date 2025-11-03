import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Firebase configuration
// You'll need to replace these with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredFields = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];
  
  const missingFields = requiredFields.filter(
    field => !firebaseConfig[field as keyof typeof firebaseConfig]
  );
  
  if (missingFields.length > 0) {
    console.warn(
      `Missing Firebase configuration fields: ${missingFields.join(', ')}. ` +
      'Please check your .env.local file.'
    );
  }
  
  if (!firebaseConfig.storageBucket) {
    console.error(
      'Firebase Storage Bucket is not configured. ' +
      'Image uploads will fail. Please set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in your .env.local file.'
    );
  }
};

// Validate config on initialization
validateFirebaseConfig();

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage with explicit bucket URL if needed
const storage = getStorage(app, firebaseConfig.storageBucket ? `gs://${firebaseConfig.storageBucket}` : undefined);

// Connect to emulators in development if needed
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('Connected to Firebase emulators');
  } catch (error) {
    console.warn('Failed to connect to Firebase emulators:', error);
  }
}

export { app, db, storage };


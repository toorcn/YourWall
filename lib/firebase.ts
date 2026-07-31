import { initializeApp, getApps } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  signInAnonymously,
  type User,
} from 'firebase/auth';
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from 'firebase/app-check';
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

const useFirebaseEmulator =
  typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

// App Check protects the public Firebase endpoints from traffic that did not
// originate from this web app. Firebase config values and the site key are
// intentionally public; authorization is still enforced by Security Rules.
const appCheckSiteKey = process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY;

declare global {
  // Prevent duplicate initialization during Next.js hot reloads.
  // eslint-disable-next-line no-var
  var __yourwallAppCheckInitialized: boolean | undefined;
}

if (
  typeof window !== 'undefined' &&
  !useFirebaseEmulator &&
  appCheckSiteKey &&
  !globalThis.__yourwallAppCheckInitialized
) {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
  globalThis.__yourwallAppCheckInitialized = true;
}

const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage with explicit bucket URL if needed
const storage = getStorage(app, firebaseConfig.storageBucket ? `gs://${firebaseConfig.storageBucket}` : undefined);

// Connect to emulators in development if needed.
if (useFirebaseEmulator) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('Connected to Firebase emulators');
  } catch (error) {
    console.warn('Failed to connect to Firebase emulators:', error);
  }
}

let authenticationPromise: Promise<User> | null = null;

/**
 * Sign visitors in anonymously before a write. Anonymous Auth gives Security
 * Rules a stable uid without adding a login screen to this public wall.
 */
export const ensureAnonymousAuth = async (): Promise<User> => {
  if (typeof window === 'undefined') {
    throw new Error('Firebase authentication is only available in the browser.');
  }

  if (auth.currentUser) {
    return auth.currentUser;
  }

  if (!authenticationPromise) {
    authenticationPromise = auth
      .authStateReady()
      .then(async () => auth.currentUser ?? (await signInAnonymously(auth)).user)
      .finally(() => {
        authenticationPromise = null;
      });
  }

  return authenticationPromise;
};

export { app, auth, db, storage };

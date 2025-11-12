import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// Check if Firebase configuration is available
// const hasFirebaseConfig =
//   process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
//   process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
//   process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
// Use environment variables if available, otherwise use placeholder values for demo
const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }

// Firebase app initialization
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Firebase service initialization
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Use emulators in development if needed
// if (process.env.NODE_ENV === 'development') {
//   connectAuthEmulator(auth, 'http://localhost:9099');
//   connectFirestoreEmulator(db, 'localhost', 8080);
//   connectStorageEmulator(storage, 'localhost', 9199);
//   connectFunctionsEmulator(functions, 'localhost', 5001);
// }

// Flag to indicate if we're using the demo configuration
// const isUsingDemoConfig = !hasFirebaseConfig;

export { app, auth, db, storage, functions };

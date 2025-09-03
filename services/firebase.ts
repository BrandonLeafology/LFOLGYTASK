
import { initializeApp, FirebaseApp } from 'firebase/app';
// By importing the services for their side effects, we ensure they are registered
// with the Firebase app instance before being used. This fixes the initialization error.
import 'firebase/auth';
import 'firebase/firestore';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, Auth, User } from 'firebase/auth';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Define the shape of the Firebase config
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

let app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

const FIREBASE_CONFIG_KEY = 'firebaseConfig';

// Function to get config from localStorage.
export const getFirebaseConfig = (): FirebaseConfig | null => {
  const configStr = localStorage.getItem(FIREBASE_CONFIG_KEY);
  if (configStr) {
    try {
      // Basic validation of parsed config
      const parsedConfig = JSON.parse(configStr);
      if (parsedConfig.apiKey && parsedConfig.projectId) {
          return parsedConfig;
      }
    } catch (e) {
      console.error("Failed to parse Firebase config from localStorage, clearing it.", e);
      // Clear corrupted or invalid config
      localStorage.removeItem(FIREBASE_CONFIG_KEY);
    }
  }
  // If no valid config in localStorage, return null.
  return null;
};

// Function to save config to localStorage
export const saveFirebaseConfig = (config: FirebaseConfig): void => {
  localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
};

// Initialize Firebase
export const initializeFirebase = () => {
  if (app) { // Already initialized
    return true;
  }

  const config = getFirebaseConfig();
  if (config) {
    try {
      app = initializeApp(config);
      _auth = getAuth(app);
      _db = getFirestore(app);
      
      // Enable offline persistence
      enableIndexedDbPersistence(_db)
        .then(() => {
          console.log("Firestore offline persistence enabled.");
        })
        .catch((err) => {
          if (err.code == 'failed-precondition') {
            console.warn("Firestore offline persistence could not be enabled, likely due to multiple tabs open. This app will not work offline in this tab.");
          } else if (err.code == 'unimplemented') {
            console.warn("Firestore offline persistence is not supported in this browser. The app will not work offline.");
          }
        });

      console.log("Firebase initialized successfully");
      return true;
    } catch (error) {
      console.error("Firebase initialization error:", error);
      app = _auth = _db = null;
      return false;
    }
  }
  
  // No config found, so cannot initialize
  return false;
};

const getAuthInstance = (): Auth => {
    if (!_auth) throw new Error("Firebase Auth is not initialized.");
    return _auth;
};

export const getDbInstance = (): Firestore => {
    if (!_db) throw new Error("Firestore is not initialized.");
    return _db;
};


export const onAuthChange = (callback: (user: User | null) => void) => {
  const auth = getAuthInstance();
  return onAuthStateChanged(auth, callback);
};

export const signInWithGoogle = async (): Promise<User | null> => {
  const auth = getAuthInstance();
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

export const doSignOut = async (): Promise<void> => {
  const auth = getAuthInstance();
  await signOut(auth);
};

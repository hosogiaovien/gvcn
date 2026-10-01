import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export interface FirebaseConfigOptions {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

// 1. Check environment variables with fallback to user's provided Firebase project 'gvcn-5adf1'
const envConfig: FirebaseConfigOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDSSp50w_xtjALx4-kgmhGo1sQH1DRt-ro',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'gvcn-5adf1.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'gvcn-5adf1',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'gvcn-5adf1.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '4414772221',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:4414772221:web:f37d1b3777d75da5677f94',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-W10FB6BLR6',
};

// 2. Check local storage override if user provided in setup modal
export function getSavedFirebaseConfig(): FirebaseConfigOptions | null {
  try {
    const raw = localStorage.getItem('school_comp_firebase_config');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading custom Firebase config from localStorage', e);
  }
  return null;
}

export function saveCustomFirebaseConfig(config: FirebaseConfigOptions) {
  localStorage.setItem('school_comp_firebase_config', JSON.stringify(config));
  window.location.reload();
}

export function clearCustomFirebaseConfig() {
  localStorage.removeItem('school_comp_firebase_config');
  window.location.reload();
}

const savedConfig = getSavedFirebaseConfig();
const activeConfig: FirebaseConfigOptions = {
  apiKey: savedConfig?.apiKey || envConfig.apiKey,
  authDomain: savedConfig?.authDomain || envConfig.authDomain,
  projectId: savedConfig?.projectId || envConfig.projectId,
  storageBucket: savedConfig?.storageBucket || envConfig.storageBucket,
  messagingSenderId: savedConfig?.messagingSenderId || envConfig.messagingSenderId,
  appId: savedConfig?.appId || envConfig.appId,
};

export const isFirebaseConfigured = Boolean(
  activeConfig.apiKey &&
  activeConfig.apiKey !== 'YOUR_FIREBASE_API_KEY' &&
  activeConfig.projectId &&
  activeConfig.projectId !== 'YOUR_FIREBASE_PROJECT_ID'
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(activeConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.warn('Firebase initialization error, fallback enabled:', error);
  }
}

export { app, auth, db, activeConfig };

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;

export function getFirebaseAdmin(): App | null {
  if (adminApp) return adminApp;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    try {
      // Fix potential escaped newlines in environment variable
      privateKey = privateKey.replace(/\\n/g, '\n');

      const existingApps = getApps();
      if (existingApps.length > 0) {
        adminApp = existingApps[0];
      } else {
        adminApp = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      }
    } catch (e) {
      console.warn('Firebase Admin SDK failed to initialize with provided credentials:', e);
    }
  }

  return adminApp;
}

export function getAdminAuth() {
  const app = getFirebaseAdmin();
  return app ? getAuth(app) : null;
}

export function getAdminFirestore() {
  const app = getFirebaseAdmin();
  return app ? getFirestore(app) : null;
}

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration for spinnight-project-webapp
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD_ZFlvregRYQxeT-tiG-x2niZIrs8pBFQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "spinnight-project-webapp.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "spinnight-project-webapp",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "spinnight-project-webapp.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "971093363923",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:971093363923:web:c045fb4d97102ed1ce9826",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-T35BQ21ZKN"
};

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth & Firestore
const auth = getAuth(app);
const db = getFirestore(app);

/**
 * Helper to sign in anonymously if not already authenticated.
 * Includes automatic fallback UID if Firebase Auth Anonymous Provider is disabled in Console.
 */
export const ensureAnonymousAuth = async () => {
  try {
    return await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Auth timeout"));
      }, 3000);

      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        clearTimeout(timer);
        if (user) {
          unsubscribe();
          resolve(user);
        } else {
          try {
            const userCredential = await signInAnonymously(auth);
            unsubscribe();
            resolve(userCredential.user);
          } catch (error) {
            unsubscribe();
            reject(error);
          }
        }
      });
    });
  } catch (error) {
    console.warn("Firebase Auth fallback enabled (Auth provider disabled or error):", error?.message || error);
    
    // Fallback: Generate or retrieve persistent guest UID for Firestore user identification
    let fallbackUid = sessionStorage.getItem('spinnight_guest_uid');
    if (!fallbackUid) {
      fallbackUid = 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      sessionStorage.setItem('spinnight_guest_uid', fallbackUid);
    }
    return { uid: fallbackUid, isAnonymous: true };
  }
};

export { app, auth, db, signInAnonymously };
export default app;

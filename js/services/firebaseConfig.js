import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as fbSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';

/**
 * Firebase Project Configuration
 * 
 * Replace these placeholder credentials with your Firebase project keys from:
 * Firebase Console > Project Settings > General > "Your apps" (Web App)
 * 
 * You can also set these in a `.env` file as VITE_FIREBASE_* variables.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_FIREBASE_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_FIREBASE_APP_ID"
};

/**
 * Checks whether valid Firebase credentials have been configured
 */
export function isFirebaseConfigured() {
  const key = firebaseConfig.apiKey;
  return Boolean(key && !key.startsWith('YOUR_') && key.length > 10);
}

// Lazy initialization of Firebase Auth
let authInstance = null;
let providerInstance = null;

function getAuthServices() {
  if (!authInstance && isFirebaseConfigured()) {
    try {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      authInstance = getAuth(app);
      providerInstance = new GoogleAuthProvider();
      providerInstance.setCustomParameters({ prompt: 'select_account' });
    } catch (err) {
      console.warn('Firebase initialization notice:', err);
    }
  }
  return { auth: authInstance, provider: providerInstance };
}

/**
 * Authenticate with real Google Popup via Firebase
 */
export async function signInWithGooglePopup() {
  if (!isFirebaseConfigured()) {
    return {
      success: false,
      unconfigured: true,
      message: 'Firebase is not yet configured with your project API keys.'
    };
  }

  const { auth, provider } = getAuthServices();
  if (!auth || !provider) {
    return {
      success: false,
      error: 'Unable to initialize Firebase authentication services.'
    };
  }

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    return {
      success: true,
      user: {
        uid: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Daybook Writer',
        email: user.email,
        avatarUrl: user.photoURL || '',
        provider: 'google',
        lastSynced: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Firebase Google Sign-In error:', error);
    return {
      success: false,
      code: error.code,
      message: error.message
    };
  }
}

/**
 * Sign out of Firebase session
 */
export async function signOutFirebase() {
  const { auth } = getAuthServices();
  if (auth) {
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.warn('Firebase signout warning:', err);
    }
  }
}

/**
 * Listen for Firebase auth state changes (e.g., page reloads)
 */
export function initFirebaseAuthListener(onUserChanged) {
  if (!isFirebaseConfigured()) return;
  const { auth } = getAuthServices();
  if (auth && typeof onUserChanged === 'function') {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        onUserChanged({
          uid: user.uid,
          name: user.displayName || user.email?.split('@')[0],
          email: user.email,
          avatarUrl: user.photoURL || '',
          provider: 'google',
          lastSynced: new Date().toISOString()
        });
      }
    });
  }
}

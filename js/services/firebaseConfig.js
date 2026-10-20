import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signOut as fbSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';

/**
 * Firebase Project Configuration
 * Note: authDomain must be daybook-ddc79.firebaseapp.com because Google OAuth Client ID
 * is pre-registered with https://daybook-ddc79.firebaseapp.com/__/auth/handler.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDplbhh8dB5Zw8sMgi-39sQroTUyCpnlPk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "daybook-ddc79.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "daybook-ddc79",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "daybook-ddc79.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "248264696451",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:248264696451:web:5002292f099de7eae9f1b6"
};

/**
 * Checks if the current browser environment is mobile, tablet, or touch-emulated
 */
export function isMobileOrTouchDevice() {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTouch = Boolean(navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || ('ontouchstart' in window);
  const isSmallScreen = window.innerWidth <= 1024;
  return isMobileUA || (isTouch && isSmallScreen);
}

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

      // Initialize Firebase Analytics for active user and traffic metrics
      if (typeof window !== 'undefined') {
        isSupported().then(supported => {
          if (supported) {
            getAnalytics(app);
          }
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('Firebase initialization notice:', err);
    }
  }
  return { auth: authInstance, provider: providerInstance };
}

let isAuthenticating = false;

/**
 * Authenticate with Google Popup via Firebase
 */
export async function signInWithGooglePopup() {
  if (isAuthenticating) {
    return {
      success: false,
      code: 'in_progress',
      message: 'A Google Sign-In window is already opening. Please check your open windows.'
    };
  }

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

  isAuthenticating = true;
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
    console.warn('Firebase Google Sign-In notice:', error.code, error.message);
    return {
      success: false,
      code: error.code,
      message: error.message
    };
  } finally {
    isAuthenticating = false;
  }
}

/**
 * Fallback to Google Redirect if popup is blocked by browser policies
 */
export async function signInWithGoogleRedirect() {
  if (!isFirebaseConfigured()) return;
  const { auth, provider } = getAuthServices();
  if (auth && provider) {
    await signInWithRedirect(auth, provider);
  }
}

/**
 * Unified Google Sign-in helper
 * Automatically chooses the best flow (redirect on mobile/tablet or popup with redirect fallback on desktop)
 */
export async function authenticateWithGoogle(options = {}) {
  const { forceRedirect = false, preferRedirect = false } = options;

  if (!isFirebaseConfigured()) {
    return {
      success: false,
      unconfigured: true,
      message: 'Firebase is not yet configured.'
    };
  }

  // 1. Mobile, tablet, or touch-emulation viewports work best with direct redirect
  if (forceRedirect || preferRedirect || isMobileOrTouchDevice()) {
    await signInWithGoogleRedirect();
    return { redirected: true };
  }

  // 2. Desktop: try popup first
  const res = await signInWithGooglePopup();
  if (res.success) {
    return res;
  }

  // 3. Fallback: if browser blocked or closed popup, switch seamlessly to redirect
  if (res.code === 'auth/popup-blocked' || res.code === 'auth/popup-closed-by-user') {
    console.info('Popup unavailable, proceeding with direct Google redirect...');
    await signInWithGoogleRedirect();
    return { redirected: true };
  }

  return res;
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
 * Listen for Firebase auth state changes & handle redirect results
 */
export function initFirebaseAuthListener(onUserChanged) {
  if (!isFirebaseConfigured()) return;
  const { auth } = getAuthServices();
  if (!auth || typeof onUserChanged !== 'function') return;

  // 1. Process redirect result if returning from a full-page redirect login
  getRedirectResult(auth)
    .then((result) => {
      if (result && result.user) {
        const u = result.user;
        onUserChanged({
          uid: u.uid,
          name: u.displayName || u.email?.split('@')[0],
          email: u.email,
          avatarUrl: u.photoURL || '',
          provider: 'google',
          isRedirectReturn: true,
          lastSynced: new Date().toISOString()
        });
      }
    })
    .catch((err) => {
      console.warn('Redirect auth result warning:', err);
    });

  // 2. Persistent auth state listener
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

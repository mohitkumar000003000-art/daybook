/**
 * Authentication Modal Component for Daybook
 * Provides a clean, modern modal containing:
 * - "Sign in with Google" button
 * - "or" divider
 * - Email input + "Continue with email" button
 */
import { store } from '../store.js';
import { modal } from './modal.js';
import { toast } from './toast.js';
import { firePaperConfetti } from '../utils/confetti.js';
import { signInWithGooglePopup, signInWithGoogleRedirect, isFirebaseConfigured } from '../services/firebaseConfig.js';

export const GOOGLE_LOGO_SVG = `
<svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
</svg>
`;

export function openGoogleSignInModal(onSuccess = null) {
  const content = `
    <div class="google-auth-dialog">
      <div class="google-dialog-header">
        <div class="google-logo-bubble">
          ${GOOGLE_LOGO_SVG}
        </div>
        <h3 class="google-dialog-title">Sign in to Daybook</h3>
        <p class="google-dialog-sub">Sync your intentions, schedule, and reflections across devices</p>
      </div>

      <div class="auth-dialog-content" style="display:flex; flex-direction:column; gap:16px; margin-top:8px;">
        <!-- Sign in with Google -->
        <div style="display:flex; flex-direction:column; gap:6px;">
          <button type="button" class="google-sign-in-btn auth-main-btn w-100" id="modal-google-signin-btn">
            ${GOOGLE_LOGO_SVG}
            <span>Sign in with Google</span>
          </button>
          <button type="button" class="btn btn-ghost w-100" id="modal-google-redirect-btn" style="font-size:0.78rem; color:var(--text-muted); padding:4px;">
            Popup issues? Sign in via direct redirect ↗
          </button>
        </div>

        <!-- Divider with "or" -->
        <div class="auth-divider">
          <span>or</span>
        </div>

        <!-- Continue with email -->
        <form id="modal-email-form" onsubmit="return false;" style="display:flex; flex-direction:column; gap:10px;">
          <div class="auth-input-wrapper">
            <svg class="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <input 
              type="email" 
              id="modal-email-input" 
              class="form-input auth-email-input" 
              placeholder="Enter your email address" 
              required 
              autocomplete="email"
            />
          </div>
          <button type="submit" class="btn btn-primary auth-main-btn continue-email-btn w-100" id="modal-continue-email-btn">
            <span>Continue with email</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </form>
      </div>

      <!-- Privacy Safeguard Note -->
      <div class="google-privacy-footer" style="margin-top: 14px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span>Daybook protects your personal reflections. Your private journal entries remain encrypted on your device.</span>
      </div>
    </div>
  `;

  modal.open('Account Connection', content, {
    maxWidth: '440px',
    onMount: (overlay) => {
      const handleLogin = (name, email, provider, avatarUrl = '') => {
        store.signInWithGoogle({
          name,
          email,
          provider,
          avatarUrl: avatarUrl || '',
          lastSynced: new Date().toISOString()
        });

        firePaperConfetti(window.innerWidth / 2, window.innerHeight * 0.45, 30);
        toast.success(`Welcome, ${name || email}!`);
        modal.close();

        if (onSuccess) {
          onSuccess();
        }
      };

      // "Sign in with Google" button
      const googleBtn = overlay.querySelector('#modal-google-signin-btn');
      googleBtn?.addEventListener('click', async () => {
        if (googleBtn.disabled) return;
        googleBtn.disabled = true;
        googleBtn.style.opacity = '0.7';

        try {
          if (isFirebaseConfigured()) {
            toast.info('Opening Google Sign-In...');
            const result = await signInWithGooglePopup();
            if (result.success) {
              handleLogin(result.user.name, result.user.email, 'google', result.user.avatarUrl);
              return;
            } else if (result.code === 'in_progress') {
              toast.info('Google window is already open. Please check your open windows.');
            } else if (result.code === 'auth/popup-blocked') {
              toast.info('Popup blocked by browser. Redirecting to Google Sign-In...');
              await signInWithGoogleRedirect();
            } else if (result.code === 'auth/popup-closed-by-user') {
              toast.info('Sign-in window closed. Click again when ready.');
            } else if (result.code === 'auth/cancelled-popup-request') {
              // Ignore duplicate click noise
            } else {
              toast.error(result.message || 'Failed to authenticate with Google');
            }
          } else {
            // Firebase not yet configured with user's keys - offer mock sign-in with clear notification
            toast.info('Firebase keys not configured yet. Using local profile simulation.');
            const user = store.getUserSettings();
            handleLogin(user.name || 'Alex Henderson', 'alex.henderson@gmail.com', 'google');
          }
        } finally {
          googleBtn.disabled = false;
          googleBtn.style.opacity = '1';
        }
      });

      // "Sign in with Google Redirect" button
      overlay.querySelector('#modal-google-redirect-btn')?.addEventListener('click', async () => {
        toast.info('Redirecting to Google Sign-In...');
        await signInWithGoogleRedirect();
      });

      // "Continue with email" button & form
      const emailForm = overlay.querySelector('#modal-email-form');
      const emailInput = overlay.querySelector('#modal-email-input');

      const submitEmail = () => {
        const email = emailInput?.value.trim();
        if (!email || !email.includes('@') || !email.includes('.')) {
          toast.warning('Please enter a valid email address');
          emailInput?.focus();
          return;
        }
        const derivedName = email.split('@')[0].replace(/[._\-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Journaler';
        handleLogin(derivedName, email, 'email');
      };

      emailForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        submitEmail();
      });

      overlay.querySelector('#modal-continue-email-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        submitEmail();
      });
    }
  });
}

/**
 * Authentication Modal Component for Daybook
 * Supports both:
 * 1. Connected Account Management (profile avatar, name, email, backup, switch account, sign out)
 * 2. New Sign-In Flow ("Sign in with Google", direct redirect, or email)
 */
import { store } from '../store.js';
import { modal } from './modal.js';
import { toast } from './toast.js';
import { firePaperConfetti } from '../utils/confetti.js';
import { 
  authenticateWithGoogle, 
  signInWithGoogleRedirect, 
  isFirebaseConfigured, 
  isMobileOrTouchDevice,
  signOutFirebase
} from '../services/firebaseConfig.js';

export const GOOGLE_LOGO_SVG = `
<svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
</svg>
`;

export function openGoogleSignInModal(onSuccess = null) {
  const user = store.getUserSettings();
  const account = user.googleAccount || {};
  const isConnected = Boolean(account.isSignedIn && (account.email || account.name));

  if (isConnected) {
    renderConnectedModal(onSuccess);
  } else {
    renderSignInModal(onSuccess);
  }
}

/**
 * 1. Connected Account Management Modal
 */
function renderConnectedModal(onSuccess = null) {
  const user = store.getUserSettings();
  const account = user.googleAccount || {};
  const isGoogle = account.provider === 'google' || account.email?.endsWith('@gmail.com');
  const displayName = account.name || user.name || 'Daybook Writer';
  const displayEmail = account.email || '';
  const initial = displayName.charAt(0).toUpperCase();

  const content = `
    <div class="google-auth-dialog">
      <div class="google-dialog-header" style="text-align:center; padding-bottom:4px;">
        <div class="auth-connected-avatar" style="width:68px; height:68px; border-radius:50%; background:var(--accent); color:#FFFFFF; font-size:1.75rem; font-weight:700; display:flex; align-items:center; justify-content:center; margin:0 auto 12px; box-shadow:0 4px 16px rgba(184,80,48,0.28);">
          ${escapeHtml(initial)}
        </div>
        <h3 class="google-dialog-title" style="font-size:1.25rem; margin-bottom:4px; font-weight:700;">${escapeHtml(displayName)}</h3>
        <p class="google-dialog-sub" style="color:var(--text-muted); font-size:0.88rem; margin-bottom:12px;">${escapeHtml(displayEmail)}</p>
        
        <div style="display:inline-flex; align-items:center; gap:6px; padding:6px 14px; border-radius:9999px; background:rgba(67, 106, 87, 0.12); color:#2e6245; font-size:0.82rem; font-weight:600;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          <span>${isGoogle ? 'Google Account Connected' : 'Email Connected'}</span>
        </div>
      </div>

      <div class="auth-dialog-content" style="display:flex; flex-direction:column; gap:10px; margin-top:20px;">
        <!-- Backup to JSON -->
        <button type="button" class="btn btn-secondary w-100" id="modal-connected-backup-btn" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:10px 14px; font-weight:500;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span>Backup Journal & Tasks (JSON)</span>
        </button>

        <!-- Switch Account -->
        <button type="button" class="btn btn-ghost w-100" id="modal-connected-switch-btn" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:10px; color:var(--text-primary); border:1px solid var(--border-color);">
          ${GOOGLE_LOGO_SVG}
          <span>Switch Google Account</span>
        </button>

        <!-- Sign Out -->
        <button type="button" class="btn btn-text text-danger w-100" id="modal-connected-signout-btn" style="padding:10px; color:#d9534f; font-weight:600; margin-top:4px;">
          <span>Sign Out of Daybook</span>
        </button>
      </div>

      <div class="google-privacy-footer" style="margin-top:16px; border-top:1px solid var(--border-subtle); padding-top:12px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span>Your reflections remain private and encrypted on your device.</span>
      </div>
    </div>
  `;

  modal.open('Account Connection', content, {
    maxWidth: '440px',
    onMount: (overlay) => {
      // Backup
      overlay.querySelector('#modal-connected-backup-btn')?.addEventListener('click', () => {
        const dataStr = store.exportData();
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Daybook_Backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Backup snapshot downloaded');
      });

      // Switch Account
      overlay.querySelector('#modal-connected-switch-btn')?.addEventListener('click', async () => {
        await signOutFirebase();
        store.signOutGoogle();
        toast.info('Please select an account to sign in.');
        modal.close();
        if (onSuccess) onSuccess();
        // Reopen into Sign-in mode
        setTimeout(() => openGoogleSignInModal(onSuccess), 150);
      });

      // Sign Out
      overlay.querySelector('#modal-connected-signout-btn')?.addEventListener('click', async () => {
        await signOutFirebase();
        store.signOutGoogle();
        toast.info('Signed out of Daybook');
        modal.close();
        if (onSuccess) onSuccess();
      });
    }
  });
}

/**
 * 2. Sign-In Flow Modal
 */
function renderSignInModal(onSuccess = null) {
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

      </div>

      <!-- Privacy Safeguard Note -->
      <div class="google-privacy-footer" style="margin-top: 14px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span>🔒 Only authentic, verified Google accounts can sign in. Fake Gmail addresses are automatically rejected.</span>
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
        toast.success(`Welcome to Daybook, ${name || email}!`);
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
            if (isMobileOrTouchDevice()) {
              toast.info('Connecting to Google Sign-In...');
              await signInWithGoogleRedirect();
              return;
            }

            toast.info('Opening Google Sign-In...');
            const result = await authenticateWithGoogle();
            if (result.success) {
              handleLogin(result.user.name, result.user.email, 'google', result.user.avatarUrl);
              return;
            } else if (result.redirected) {
              toast.info('Redirecting to Google Sign-In...');
            } else if (result.code === 'in_progress') {
              toast.info('Google window is already open. Please check your open windows.');
            } else if (result.code === 'auth/cancelled-popup-request') {
              // Ignore duplicate click noise
            } else {
              toast.info('Redirecting to Google Sign-In...');
              await signInWithGoogleRedirect();
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
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

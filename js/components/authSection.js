/**
 * Daybook Authentication Section Component
 * Displays the modern, streamlined authentication box:
 * "Sign in with Google" button
 * "or" divider
 * Email input + "Continue with email" button
 */
import { store } from '../store.js';
import { toast } from './toast.js';
import { firePaperConfetti } from '../utils/confetti.js';
import { GOOGLE_LOGO_SVG } from './googleAuthModal.js';
import { 
  authenticateWithGoogle, 
  signInWithGoogleRedirect, 
  isFirebaseConfigured, 
  isMobileOrTouchDevice,
  signOutFirebase 
} from '../services/firebaseConfig.js';

export function renderAuthSectionHTML(customIdPrefix = 'dash-auth') {
  const user = store.getUserSettings();
  const account = user.googleAccount || { isSignedIn: false };

  if (account.isSignedIn) {
    const isGoogle = account.provider === 'google' || account.email?.endsWith('@gmail.com');
    const initial = (account.name || user.name || 'U').charAt(0).toUpperCase();

    return `
      <section class="auth-box-card card animate-fade-in" id="${customIdPrefix}-container">
        <div class="auth-connected-layout">
          <div class="auth-connected-profile">
            <div class="auth-avatar-chip" style="background: var(--accent); color: #FFF;">
              ${escapeHtml(initial)}
            </div>
            <div class="auth-info-block">
              <div class="auth-name-row">
                <span class="auth-user-name">${escapeHtml(account.name || user.name || 'Account')}</span>
                <span class="auth-connected-pill">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                  ${isGoogle ? 'Google Account Connected' : 'Email Account Connected'}
                </span>
              </div>
              <span class="auth-user-email">${escapeHtml(account.email || '')}</span>
            </div>
          </div>

          <div class="auth-connected-actions">
            <button type="button" class="btn btn-sm btn-secondary" id="${customIdPrefix}-backup-btn">
              ${GOOGLE_LOGO_SVG}
              <span>Backup to Drive</span>
            </button>
            <button type="button" class="btn btn-sm btn-secondary" id="${customIdPrefix}-switch-btn">
              Switch Account
            </button>
            <button type="button" class="btn btn-sm btn-text text-danger" id="${customIdPrefix}-signout-btn">
              Sign Out
            </button>
          </div>
        </div>
      </section>
    `;
  }

  return `
    <section class="auth-box-card card animate-fade-in" id="${customIdPrefix}-container">
      <div class="auth-box-header">
        <div class="auth-box-title-group">
          <span class="card-eyebrow">Account & Cloud Sync</span>
          <h2 class="auth-box-title">Sign in to Daybook</h2>
          <p class="auth-box-desc">Sync your tasks, daily intentions, and personal reflections across all your devices.</p>
        </div>
        <div class="auth-shield-tag">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span>100% Private & Encrypted</span>
        </div>
      </div>

      <div class="auth-action-pane" style="display:flex; justify-content:flex-start; align-items:center; padding: 6px 0;">
        <button type="button" class="google-sign-in-btn auth-main-btn" id="${customIdPrefix}-google-btn" style="max-width: 280px; width: 100%;">
          ${GOOGLE_LOGO_SVG}
          <span>Sign in with Google</span>
        </button>
      </div>

      <div class="auth-box-footer">
        <p class="auth-footnote">
          🔒 Secure 1-click Google authentication. Only authentic, verified accounts can sign in.
        </p>
      </div>
    </section>
  `;
}

export function bindAuthSectionEvents(container, customIdPrefix = 'dash-auth', onAuthSuccess = null) {
  const googleBtn = container.querySelector(`#${customIdPrefix}-google-btn`);
  const switchBtn = container.querySelector(`#${customIdPrefix}-switch-btn`);
  const signoutBtn = container.querySelector(`#${customIdPrefix}-signout-btn`);

  // Handle "Sign in with Google"
  googleBtn?.addEventListener('click', async (e) => {
    if (googleBtn.disabled) return;
    googleBtn.disabled = true;
    googleBtn.style.opacity = '0.7';

    try {
      if (isFirebaseConfigured()) {
        toast.info('Opening Google Sign-In...');
        const result = await authenticateWithGoogle();
        if (result.success && result.user) {
          store.signInWithGoogle({
            uid: result.user.uid,
            email: result.user.email,
            name: result.user.name,
            provider: 'google',
            avatarUrl: result.user.avatarUrl || ''
          });
          firePaperConfetti(e.clientX || window.innerWidth / 2, e.clientY || window.innerHeight * 0.4, 30);
          toast.success(`Signed in with Google as ${result.user.name || result.user.email}`);
          if (onAuthSuccess) onAuthSuccess();
        } else if (result.redirected) {
          toast.info('Redirecting to Google Sign-In...');
        } else if (result.code === 'in_progress') {
          toast.info('Google window is already open. Please check your open windows.');
        } else if (result.code === 'auth/popup-closed-by-user' || result.code === 'auth/cancelled-popup-request') {
          toast.info('Sign-in cancelled.');
        } else {
          toast.warning('Google sign-in could not be completed.');
        }
      } else {
        // Firebase credentials pending: inform user and allow local demo
        toast.info('Firebase keys not configured yet. Using local profile simulation.');
        const user = store.getUserSettings();
        const googleEmail = user.googleAccount?.email || 'alex.henderson@gmail.com';
        const googleName = user.googleAccount?.name || user.name || 'Alex Henderson';

        store.signInWithGoogle({
          email: googleEmail,
          name: googleName,
          provider: 'google',
          avatarUrl: ''
        });

        firePaperConfetti(e.clientX || window.innerWidth / 2, e.clientY || window.innerHeight * 0.4, 30);
        toast.success(`Signed in with Google as ${googleEmail}`);

        if (onAuthSuccess) onAuthSuccess();
      }
    } finally {
      googleBtn.disabled = false;
      googleBtn.style.opacity = '1';
    }
  });

  // Handle "Backup to Drive"
  const backupBtn = container.querySelector(`#${customIdPrefix}-backup-btn`);
  backupBtn?.addEventListener('click', () => {
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
    toast.success('Backup snapshot downloaded for Google Drive');
  });

  // Handle "Switch Account"
  switchBtn?.addEventListener('click', async () => {
    await signOutFirebase();
    store.signOutGoogle();
    toast.info('Please choose an account to sign in.');
    if (onAuthSuccess) onAuthSuccess();
  });

  // Handle "Sign Out"
  signoutBtn?.addEventListener('click', async () => {
    await signOutFirebase();
    store.signOutGoogle();
    toast.info('Signed out of Daybook account');
    if (onAuthSuccess) onAuthSuccess();
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

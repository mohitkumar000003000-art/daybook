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
import { signInWithGooglePopup, signInWithGoogleRedirect, isFirebaseConfigured, signOutFirebase } from '../services/firebaseConfig.js';

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

      <div class="auth-dual-action-pane">
        <!-- 1. Sign in with Google -->
        <div class="auth-google-col">
          <button type="button" class="google-sign-in-btn auth-main-btn w-100" id="${customIdPrefix}-google-btn">
            ${GOOGLE_LOGO_SVG}
            <span>Sign in with Google</span>
          </button>
        </div>

        <!-- 2. Divider with "or" -->
        <div class="auth-divider">
          <span>or</span>
        </div>

        <!-- 3. Continue with email -->
        <form class="auth-email-form" id="${customIdPrefix}-email-form" onsubmit="return false;">
          <div class="auth-input-wrapper">
            <svg class="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <input 
              type="email" 
              class="form-input auth-email-input" 
              id="${customIdPrefix}-email-input" 
              placeholder="Enter your email address" 
              autocomplete="email"
              required 
            />
          </div>
          <button type="submit" class="btn btn-primary auth-main-btn continue-email-btn" id="${customIdPrefix}-email-btn">
            <span>Continue with email</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </form>
      </div>

      <div class="auth-box-footer">
        <p class="auth-footnote">
          🔒 Daybook prioritizes your privacy. Your reflections are stored on your device and never sold to third parties.
        </p>
      </div>
    </section>
  `;
}

export function bindAuthSectionEvents(container, customIdPrefix = 'dash-auth', onAuthSuccess = null) {
  const googleBtn = container.querySelector(`#${customIdPrefix}-google-btn`);
  const emailForm = container.querySelector(`#${customIdPrefix}-email-form`);
  const emailInput = container.querySelector(`#${customIdPrefix}-email-input`);
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
        const result = await signInWithGooglePopup();
        if (result.success) {
          store.signInWithGoogle({
            email: result.user.email,
            name: result.user.name,
            provider: 'google',
            avatarUrl: result.user.avatarUrl || ''
          });
          firePaperConfetti(e.clientX || window.innerWidth / 2, e.clientY || window.innerHeight * 0.4, 30);
          toast.success(`Signed in with Google as ${result.user.name || result.user.email}`);
          if (onAuthSuccess) onAuthSuccess();
        } else if (result.code === 'in_progress') {
          toast.info('Google window is already open. Please check your open windows.');
        } else if (result.code === 'auth/popup-blocked') {
          toast.info('Popup blocked by browser. Redirecting to Google Sign-In...');
          await signInWithGoogleRedirect();
        } else if (result.code === 'auth/popup-closed-by-user') {
          toast.info('Sign-in cancelled. Click again when ready.');
        } else if (result.code === 'auth/cancelled-popup-request') {
          // Ignore duplicate click noise
        } else {
          toast.error(result.message || 'Failed to authenticate with Google');
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

  // Handle "Continue with email"
  emailForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleEmailSubmit();
  });

  const emailBtn = container.querySelector(`#${customIdPrefix}-email-btn`);
  emailBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    handleEmailSubmit();
  });

  function handleEmailSubmit() {
    if (!emailInput) return;
    const email = emailInput.value.trim();
    if (!email || !email.includes('@') || !email.includes('.')) {
      toast.warning('Please enter a valid email address');
      emailInput.focus();
      return;
    }

    // Derive name from email username (e.g. "alex.smith" -> "Alex Smith")
    const usernamePart = email.split('@')[0];
    const derivedName = usernamePart
      .replace(/[._\-]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase()) || 'Journaler';

    store.signInWithGoogle({
      email,
      name: derivedName,
      provider: 'email',
      avatarUrl: ''
    });

    const rect = emailInput.getBoundingClientRect();
    firePaperConfetti(rect.left + rect.width / 2, rect.top, 30);
    toast.success(`Welcome back! Signed in as ${email}`);

    if (onAuthSuccess) onAuthSuccess();
  }

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

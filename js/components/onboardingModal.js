/**
 * Daybook First-Visit Onboarding Modal Component
 * Gives first-time visitors two clear options:
 * - "Start Fresh" — creates an empty personal workspace without sample data
 * - "Explore Demo" — loads realistic sample data clearly labeled as demo content
 */
import { store } from '../store.js';
import { toast } from './toast.js';
import { firePaperConfetti } from '../utils/confetti.js';

export function shouldShowOnboarding() {
  const completedFlag = localStorage.getItem('daybook_onboarding_completed');
  if (completedFlag === 'true') {
    return false;
  }
  // Check if existing user already has saved tasks or entries
  const tasks = store.getTasks();
  const entries = store.getJournalEntries();
  const user = store.getUserSettings();

  // If user has saved tasks, entries, or profile name, they are an existing user
  if (tasks.length > 0 || entries.length > 0 || (user.name && user.name.trim() !== '')) {
    localStorage.setItem('daybook_onboarding_completed', 'true');
    return false;
  }

  return true;
}

export function showOnboardingModal(onComplete) {
  // Prevent duplicate modals
  if (document.getElementById('daybook-onboarding-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'daybook-onboarding-overlay';
  overlay.className = 'onboarding-overlay animate-fade-in';

  overlay.innerHTML = `
    <div class="onboarding-dialog animate-scale-up" role="dialog" aria-modal="true" aria-labelledby="onboarding-welcome-title">
      <div class="onboarding-badge">
        <span class="brand-monogram">D</span>
      </div>

      <h1 class="onboarding-title" id="onboarding-welcome-title">Welcome to Daybook</h1>
      <p class="onboarding-subtitle">
        Your private daily planner, focus anchor, and reflective journal. Designed for intentional living with zero tracking.
      </p>

      <div class="onboarding-single-choice">
        <div class="onboarding-card onboarding-card-fresh w-100" id="onboarding-start-fresh-card">
          <div class="choice-icon-wrap fresh-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v20M2 12h20"/>
            </svg>
          </div>
          <div class="choice-info">
            <h3 class="choice-title">Clean Slate Workspace</h3>
            <p class="choice-desc">
              Your Daybook starts completely clean. Zero pre-filled tasks, zero sample entries, and no dummy statistics. You have total creative freedom.
            </p>
          </div>
        </div>
      </div>

      <div class="onboarding-name-prompt w-100" style="margin-top: 18px; text-align: left;">
        <label for="onboarding-name-input" class="form-label">What should Daybook call you? (Optional)</label>
        <input type="text" id="onboarding-name-input" class="form-input" placeholder="Your name or pen name (e.g., Mohit)" maxlength="30" />
      </div>

      <button type="button" class="btn btn-primary onboarding-btn w-100" id="onboarding-btn-fresh" style="margin-top: 20px; font-size: 1rem; padding: 12px 20px;">
        Start My Daybook
      </button>

      <div class="onboarding-footer" style="margin-top: 20px;">
        <p class="onboarding-privacy-note">
          🔒 <strong>100% Private by default.</strong> Everything stays in your browser’s local storage on this device.
        </p>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.classList.add('modal-open');

  const closeOnboarding = () => {
    overlay.classList.remove('animate-fade-in');
    overlay.classList.add('animate-fade-out');
    setTimeout(() => {
      overlay.remove();
      document.body.classList.remove('modal-open');
    }, 200);
  };

  // Start Clean
  const handleStartFresh = (e) => {
    localStorage.setItem('daybook_onboarding_completed', 'true');
    const nameInput = overlay.querySelector('#onboarding-name-input');
    const enteredName = nameInput ? nameInput.value.trim() : '';

    store.clearAllData();
    if (enteredName) {
      store.updateUserSettings({ name: enteredName });
    }

    closeOnboarding();
    firePaperConfetti(e?.clientX || window.innerWidth / 2, e?.clientY || window.innerHeight * 0.4, 30);
    toast.success(enteredName ? `Welcome to Daybook, ${enteredName}!` : 'Welcome to Daybook! Your clean workspace is ready.');
    if (onComplete) onComplete('fresh');
  };

  overlay.querySelector('#onboarding-btn-fresh')?.addEventListener('click', handleStartFresh);
  overlay.querySelector('#onboarding-name-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleStartFresh(e);
    }
  });
}

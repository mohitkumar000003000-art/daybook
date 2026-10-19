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

      <div class="onboarding-choices-grid">
        <!-- Option 1: Start Fresh -->
        <div class="onboarding-card onboarding-card-fresh" id="onboarding-start-fresh-card">
          <div class="choice-icon-wrap fresh-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v20M2 12h20"/>
            </svg>
          </div>
          <div class="choice-info">
            <div class="choice-header-row">
              <h3 class="choice-title">Start Fresh</h3>
              <span class="choice-badge badge-recommended">Recommended</span>
            </div>
            <p class="choice-desc">
              Begin with a clean, empty Daybook. No demo tasks, no sample reflections, no dummy stats—purely yours.
            </p>
          </div>
          <button type="button" class="btn btn-primary onboarding-btn" id="onboarding-btn-fresh">
            Start Fresh Workspace
          </button>
        </div>

        <!-- Option 2: Explore Demo -->
        <div class="onboarding-card onboarding-card-demo" id="onboarding-explore-demo-card">
          <div class="choice-icon-wrap demo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          <div class="choice-info">
            <div class="choice-header-row">
              <h3 class="choice-title">Explore Demo</h3>
              <span class="choice-badge badge-sample">Sample Data</span>
            </div>
            <p class="choice-desc">
              Preview Daybook with realistic sample tasks, time-blocks, and journal entries. Clearly labeled as demo content.
            </p>
          </div>
          <button type="button" class="btn btn-secondary onboarding-btn" id="onboarding-btn-demo">
            Explore with Demo Data
          </button>
        </div>
      </div>

      <div class="onboarding-footer">
        <p class="onboarding-privacy-note">
          🔒 <strong>100% Private by default.</strong> Everything stays in your browser’s local storage. You can switch between fresh or demo anytime in Settings.
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

  // Choice: Start Fresh
  const handleStartFresh = (e) => {
    localStorage.setItem('daybook_onboarding_completed', 'true');
    store.clearAllData();
    closeOnboarding();
    firePaperConfetti(e?.clientX || window.innerWidth / 2, e?.clientY || window.innerHeight * 0.4, 25);
    toast.success('Welcome to Daybook! Your clean workspace is ready.');
    if (onComplete) onComplete('fresh');
  };

  // Choice: Explore Demo
  const handleExploreDemo = (e) => {
    localStorage.setItem('daybook_onboarding_completed', 'true');
    store.resetToDemoData();
    closeOnboarding();
    firePaperConfetti(e?.clientX || window.innerWidth / 2, e?.clientY || window.innerHeight * 0.4, 30);
    toast.info('Demo content loaded. Explore all features or clear anytime in Settings.');
    if (onComplete) onComplete('demo');
  };

  overlay.querySelector('#onboarding-btn-fresh')?.addEventListener('click', handleStartFresh);
  overlay.querySelector('#onboarding-start-fresh-card')?.addEventListener('click', (e) => {
    if (e.target.id !== 'onboarding-btn-fresh') handleStartFresh(e);
  });

  overlay.querySelector('#onboarding-btn-demo')?.addEventListener('click', handleExploreDemo);
  overlay.querySelector('#onboarding-explore-demo-card')?.addEventListener('click', (e) => {
    if (e.target.id !== 'onboarding-btn-demo') handleExploreDemo(e);
  });
}

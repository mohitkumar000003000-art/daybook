/**
 * Settings & Privacy View for Daybook
 * Theme selection, profile name, complete local privacy explanation,
 * JSON backup export/import, data reset, and keyboard shortcuts guide.
 */
import { store } from '../store.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { openGoogleSignInModal, GOOGLE_LOGO_SVG } from '../components/googleAuthModal.js';
import { renderAuthSectionHTML, bindAuthSectionEvents } from '../components/authSection.js';

export class SettingsView {
  constructor({ container, onThemeChange }) {
    this.container = container;
    this.onThemeChange = onThemeChange;
  }

  render() {
    const user = store.getUserSettings();
    const googleAccount = user.googleAccount || { isSignedIn: false };
    const taskCount = store.getTasks().length;
    const entryCount = store.getJournalEntries().length;

    this.container.innerHTML = `
      <div class="view-content settings-view">
        <!-- View Header -->
        <header class="view-header">
          <div class="view-header-title">
            <span class="card-eyebrow">Preferences & Safeguards</span>
            <h1 class="page-title">Settings & Data Privacy</h1>
            <p class="page-subtext">Manage your personal preferences, export complete data backups, and configure your writing environment.</p>
          </div>
        </header>

        <div class="settings-grid">
          <!-- 1. Profile & Theme Preferences Card -->
          <div class="card settings-card">
            <div class="card-header">
              <div class="card-title-group">
                <span class="card-eyebrow">Personalization</span>
                <h2 class="card-title">Profile & Appearance</h2>
              </div>
            </div>

            <div class="form-group">
              <label for="settings-user-name" class="form-label">Your Name or Pen Name</label>
              <input type="text" id="settings-user-name" class="form-input" value="${escapeHtml(user.name || '')}" placeholder="What should Daybook call you?" maxlength="30" />
            </div>

            <div class="form-group">
              <label class="form-label">Color Theme</label>
              <div class="theme-picker-group">
                <label class="theme-option ${user.theme === 'light' ? 'selected' : ''}">
                  <input type="radio" name="app-theme" value="light" ${user.theme === 'light' ? 'checked' : ''} />
                  <div class="theme-card-preview theme-light-preview">
                    <span class="theme-color-chip" style="background:#FBF9F5; border:1px solid #EAE4DB;"></span>
                    <span class="theme-label-name">Warm Paper (Light)</span>
                  </div>
                </label>

                <label class="theme-option ${user.theme === 'dark' ? 'selected' : ''}">
                  <input type="radio" name="app-theme" value="dark" ${user.theme === 'dark' ? 'checked' : ''} />
                  <div class="theme-card-preview theme-dark-preview">
                    <span class="theme-color-chip" style="background:#171615; border:1px solid #32302D;"></span>
                    <span class="theme-label-name">Deep Espresso (Dark)</span>
                  </div>
                </label>
              </div>
            </div>

            <button class="btn btn-primary" id="save-profile-btn">Save Profile</button>
          </div>

          <!-- 2. Account & Cloud Backup Card -->
          <div style="grid-column: 1 / -1;">
            ${renderAuthSectionHTML('settings-auth')}
          </div>

          <!-- 3. Local Storage & Privacy Declaration Card -->
          <div class="card settings-card privacy-card">
            <div class="card-header">
              <div class="card-title-group">
                <span class="card-eyebrow">Privacy & Sovereignty</span>
                <h2 class="card-title">Data Storage & Account Sync</h2>
              </div>
              <span class="privacy-badge">🔒 Private by Default</span>
            </div>

            <div class="privacy-explanation">
              <p>
                <strong>Daybook is private by design.</strong> By default, all your personal planner tasks, daily goals, and journal reflections are stored directly inside this browser’s private local storage.
              </p>
              <ul class="privacy-bullets">
                <li><strong>Local-first storage:</strong> Your notes and tasks live on your device and are isolated per browser and user profile.</li>
                <li><strong>Selective account sync:</strong> When you connect your Google or Email account, only your own authenticated records sync to your account. No unauthenticated devices or third parties receive your data.</li>
                <li><strong>Zero advertising trackers:</strong> No third-party ad networks, no data brokers, and no tracking scripts.</li>
                <li><strong>Full data portability:</strong> You can export complete JSON snapshots or restore backups at any time.</li>
              </ul>
            </div>

            <div class="storage-health-row">
              <span class="storage-health-label">Local Records:</span>
              <span class="storage-health-val">${taskCount} tasks • ${entryCount} journal entries</span>
            </div>
          </div>


          <!-- 4. Danger Zone & Reset Card -->
          <div class="card settings-card danger-card">
            <div class="card-header">
              <div class="card-title-group">
                <span class="card-eyebrow">Reset Options</span>
                <h2 class="card-title">Clean Slate & Reset</h2>
              </div>
            </div>

            <p class="card-description">
              Reset your Daybook to a completely clean workspace, erasing all saved tasks, journal entries, and time blocks.
            </p>

            <div class="danger-actions-row">
              <button class="btn btn-danger" id="clear-all-data-btn">
                Clear All Data & Start Fresh
              </button>
            </div>
          </div>

          <!-- 5. Keyboard Shortcuts Reference Card -->
          <div class="card settings-card shortcuts-card">
            <div class="card-header">
              <div class="card-title-group">
                <span class="card-eyebrow">Quick Navigation</span>
                <h2 class="card-title">Keyboard Shortcuts</h2>
              </div>
            </div>

            <div class="shortcuts-grid">
              <div class="shortcut-item">
                <span class="key-combo"><kbd>Esc</kbd></span>
                <span class="key-desc">Close any modal or dialog</span>
              </div>
              <div class="shortcut-item">
                <span class="key-combo"><kbd>Ctrl</kbd> + <kbd>B</kbd></span>
                <span class="key-desc">Bold text in journal editor</span>
              </div>
              <div class="shortcut-item">
                <span class="key-combo"><kbd>Ctrl</kbd> + <kbd>I</kbd></span>
                <span class="key-desc">Italic text in journal editor</span>
              </div>
              <div class="shortcut-item">
                <span class="key-combo"><kbd>Enter</kbd></span>
                <span class="key-desc">Quick add task on Tasks page</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // Theme options
    this.container.querySelectorAll('input[name="app-theme"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const theme = e.target.value;
        store.updateUserSettings({ theme });
        if (this.onThemeChange) {
          this.onThemeChange(theme);
        }
        this.container.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('selected'));
        radio.closest('.theme-option').classList.add('selected');
        toast.info(`Theme set to ${theme === 'dark' ? 'Deep Espresso' : 'Warm Paper'}`);
      });
    });

    // Save profile name
    this.container.querySelector('#save-profile-btn')?.addEventListener('click', () => {
      const name = this.container.querySelector('#settings-user-name').value.trim();
      store.updateUserSettings({ name });
      toast.success(name ? `Profile updated for ${name}` : 'Profile updated');
    });

    // Bind Auth Section events (Sign in with Google & Continue with email)
    bindAuthSectionEvents(this.container, 'settings-auth', () => this.render());

    // Google Drive Backup export
    this.container.querySelector('#google-drive-backup-btn')?.addEventListener('click', () => {
      const dataStr = store.exportData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Daybook_GoogleDrive_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Google Drive backup snapshot downloaded');
    });


    // Clear all data & start fresh
    this.container.querySelector('#clear-all-data-btn')?.addEventListener('click', async () => {
      const confirmed = await modal.confirm({
        title: 'Clear All Data',
        message: 'Are you sure you want to completely erase all tasks, reflections, and schedules? This cannot be undone unless you have a JSON backup.',
        confirmText: 'Clear Everything',
        isDestructive: true
      });
      if (confirmed) {
        store.clearAllData();
        toast.info('All data cleared. Starting fresh.');
        this.render();
      }
    });
  }
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

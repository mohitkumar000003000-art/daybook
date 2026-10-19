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
                <span class="card-eyebrow">Zero Cloud Tracking</span>
                <h2 class="card-title">Data Privacy & Local Storage</h2>
              </div>
              <span class="privacy-badge">🔒 100% Private</span>
            </div>

            <div class="privacy-explanation">
              <p>
                <strong>Daybook is strictly private by design.</strong> Unlike ordinary online services that store personal thoughts on remote servers, 
                everything you write in Daybook—your journal entries, daily goals, reflections, and tasks—is saved directly inside your browser’s local storage.
              </p>
              <ul class="privacy-bullets">
                <li>No account creation or password tracking</li>
                <li>Zero advertising telemetry or external cloud sync</li>
                <li>Data remains on your device at all times</li>
                <li>To transfer your records across computers, use the JSON Backup export below</li>
              </ul>
            </div>

            <div class="storage-health-row">
              <span class="storage-health-label">Local Records:</span>
              <span class="storage-health-val">${taskCount} tasks • ${entryCount} journal entries</span>
            </div>
          </div>

          <!-- 3. Backup, Export & Import Card -->
          <div class="card settings-card">
            <div class="card-header">
              <div class="card-title-group">
                <span class="card-eyebrow">Data Sovereignty</span>
                <h2 class="card-title">Export & Backup</h2>
              </div>
            </div>

            <p class="card-description">
              You own your data. Download complete backups anytime to keep in your personal records or transfer to another browser.
            </p>

            <div class="backup-actions-grid">
              <div class="backup-action-box">
                <h4>Full JSON Backup</h4>
                <p>Complete snapshot of all tasks, categories, daily plans, and journal entries.</p>
                <button class="btn btn-secondary w-100" id="export-json-btn">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download JSON Backup
                </button>
              </div>

              <div class="backup-action-box">
                <h4>Restore from Backup</h4>
                <p>Upload a previously exported Daybook JSON file to restore your entire notebook.</p>
                <label class="btn btn-secondary w-100 file-btn-label">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Select JSON File
                  <input type="file" id="import-json-input" accept=".json" style="display:none;" />
                </label>
              </div>
            </div>
          </div>

          <!-- 4. Danger Zone & Reset Card -->
          <div class="card settings-card danger-card">
            <div class="card-header">
              <div class="card-title-group">
                <span class="card-eyebrow">Reset Options</span>
                <h2 class="card-title">Sample Data & Reset</h2>
              </div>
            </div>

            <p class="card-description">
              Reload the curated demonstration tasks and journal reflections, or clear all records to start completely fresh.
            </p>

            <div class="danger-actions-row">
              <button class="btn btn-secondary" id="reload-demo-btn">
                Reload Demo Data
              </button>
              <button class="btn btn-danger" id="clear-all-data-btn">
                Clear All Data
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
      const name = this.container.querySelector('#settings-user-name').value.trim() || 'Alex';
      store.updateUserSettings({ name });
      toast.success('Profile updated');
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

    // Export JSON
    this.container.querySelector('#export-json-btn')?.addEventListener('click', () => {
      const dataStr = store.exportData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daybook_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Backup JSON downloaded');
    });

    // Import JSON
    this.container.querySelector('#import-json-input')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        const confirmed = await modal.confirm({
          title: 'Restore Backup',
          message: 'Restoring a backup will overwrite existing local tasks and journal entries. Do you wish to continue?',
          confirmText: 'Restore',
          isDestructive: false
        });

        if (confirmed) {
          const res = store.importData(event.target.result);
          if (res.success) {
            toast.success('Data backup successfully restored!');
            this.render();
          } else {
            toast.error('Failed to import backup: ' + res.error);
          }
        }
      };
      reader.readAsText(file);
    });

    // Reload demo data
    this.container.querySelector('#reload-demo-btn')?.addEventListener('click', async () => {
      const confirmed = await modal.confirm({
        title: 'Reload Demo Data',
        message: 'This will reset your tasks and reflections to the curated demonstration dataset. Proceed?',
        confirmText: 'Reload Demo Data',
        isDestructive: false
      });
      if (confirmed) {
        store.resetToDemoData();
        toast.success('Demo data restored');
        this.render();
      }
    });

    // Clear all data
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

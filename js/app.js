/**
 * Daybook Main Application Controller
 */
import { store } from './store.js';
import { modal } from './components/modal.js';
import { toast } from './components/toast.js';
import { getTodayString, formatLiveClock, formatDisplayDate } from './utils/dateUtils.js';

import { DashboardView } from './views/dashboardView.js';
import { TasksView } from './views/tasksView.js';
import { JournalView } from './views/journalView.js';
import { CalendarView } from './views/calendarView.js';
import { PlanView } from './views/planView.js';
import { ProgressView } from './views/progressView.js';
import { SettingsView } from './views/settingsView.js';
import { attachButtonRipples } from './utils/interactiveFX.js';
import { openGoogleSignInModal } from './components/googleAuthModal.js';
import { shouldShowOnboarding, showOnboardingModal } from './components/onboardingModal.js';
import { initFirebaseAuthListener } from './services/firebaseConfig.js';

class App {
  constructor() {
    this.currentView = 'dashboard';
    this.mainContainer = document.getElementById('main-view-container');
    this.sidebar = document.getElementById('app-sidebar');
    this.sidebarOverlay = document.getElementById('sidebar-backdrop');
    
    this.views = {
      dashboard: new DashboardView({
        container: this.mainContainer,
        onNavigate: (viewName) => this.navigate(viewName),
        onOpenTaskModal: (taskId, initialDate) => this.openTaskModal(taskId, initialDate),
        onOpenJournalEditor: (entryId, initialDate) => this.openJournalEditor(entryId, initialDate)
      }),
      tasks: new TasksView({
        container: this.mainContainer,
        onOpenTaskModal: (taskId, initialDate) => this.openTaskModal(taskId, initialDate)
      }),
      journal: new JournalView({
        container: this.mainContainer
      }),
      calendar: new CalendarView({
        container: this.mainContainer,
        onOpenTaskModal: (taskId, initialDate) => this.openTaskModal(taskId, initialDate),
        onOpenJournalEditor: (entryId, initialDate) => this.openJournalEditor(entryId, initialDate)
      }),
      plan: new PlanView({
        container: this.mainContainer,
        onOpenTaskModal: (taskId, initialDate) => this.openTaskModal(taskId, initialDate),
        onOpenJournalEditor: (entryId, initialDate) => this.openJournalEditor(entryId, initialDate)
      }),
      progress: new ProgressView({
        container: this.mainContainer,
        onOpenJournalEditor: (entryId) => this.openJournalEditor(entryId)
      }),
      settings: new SettingsView({
        container: this.mainContainer,
        onThemeChange: (theme) => this.applyTheme(theme)
      })
    };

    this.init();
  }

  init() {
    // 1. Apply theme
    const user = store.getUserSettings();
    this.applyTheme(user.theme || 'light');

    // 2. Setup sidebar and mobile bottom navigation listeners
    this.bindNavigation();
    this.initMobileSheets();

    // 3. Setup global task modal button in sidebar
    document.getElementById('sidebar-new-task-btn')?.addEventListener('click', () => {
      this.openTaskModal();
      this.closeMobileSidebar();
    });

    document.getElementById('sidebar-new-journal-btn')?.addEventListener('click', () => {
      this.openJournalEditor();
      this.closeMobileSidebar();
    });

    // 4. Mobile sidebar toggle
    document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
      this.toggleMobileSidebar();
    });

    this.sidebarOverlay?.addEventListener('click', () => {
      this.closeMobileSidebar();
    });

    // 5. Sidebar Google account & profile click
    document.getElementById('sidebar-user-chip')?.addEventListener('click', () => {
      openGoogleSignInModal(() => {
        this.updateSidebarUserProfile();
        this.renderCurrentView();
      });
    });

    // Mobile top bar profile click
    document.getElementById('mobile-top-user-btn')?.addEventListener('click', () => {
      openGoogleSignInModal(() => {
        this.updateSidebarUserProfile();
        this.renderCurrentView();
      });
    });

    // Mobile live date
    const topDateEl = document.getElementById('mobile-top-date');
    if (topDateEl) {
      topDateEl.textContent = formatDisplayDate(new Date(), { weekday: 'short', month: 'short', day: 'numeric' });
    }

    // 6. Global quick theme toggle in sidebar
    document.getElementById('sidebar-theme-toggle')?.addEventListener('click', () => {
      const cur = store.getUserSettings();
      const nextTheme = cur.theme === 'dark' ? 'light' : 'dark';
      store.updateUserSettings({ theme: nextTheme });
      this.applyTheme(nextTheme);
      toast.info(`Switched to ${nextTheme === 'dark' ? 'Deep Espresso' : 'Warm Paper'} mode`);
    });

    // 7. Global keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      const isInput = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
      if (!isInput) {
        if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          this.openTaskModal();
        } else if (e.key === 'j' || e.key === 'J') {
          e.preventDefault();
          this.openJournalEditor();
        }
      }
    });

    // 8. Subscribe to store changes to re-render active view if appropriate
    store.subscribe((event) => {
      this.updateSidebarUserProfile();
      // Don't disturb typing in journal editor
      if (this.currentView === 'journal' && this.views.journal.mode === 'editor') {
        return;
      }
      this.renderCurrentView();
    });

    // Initial render
    this.updateSidebarUserProfile();
    this.navigate('dashboard');
    attachButtonRipples(document.body);


    // 9. Check first-run onboarding
    if (shouldShowOnboarding()) {
      showOnboardingModal((choice) => {
        this.updateSidebarUserProfile();
        this.renderCurrentView();
      });
    }

    // 10. Listen for Firebase Google Auth state change
    initFirebaseAuthListener((firebaseUser) => {
      store.signInWithGoogle(firebaseUser);
      this.updateSidebarUserProfile();
      this.renderCurrentView();
      if (firebaseUser.isRedirectReturn) {
        toast.success(`Welcome to Daybook, ${firebaseUser.name || firebaseUser.email}!`);
      }
    });
  }

  updateSidebarUserProfile() {
    const user = store.getUserSettings();
    const googleAccount = user.googleAccount;
    const nameEl = document.getElementById('sidebar-user-name');
    const avatarEl = document.getElementById('sidebar-user-avatar');
    const mobileAvatarEl = document.getElementById('mobile-top-avatar');
    const statusEl = document.getElementById('sidebar-user-status');

    if (googleAccount && googleAccount.isSignedIn) {
      if (nameEl) nameEl.textContent = googleAccount.name || user.name || 'My Daybook';
      const initial = (googleAccount.name || user.name || 'D').charAt(0).toUpperCase();
      if (avatarEl) {
        avatarEl.textContent = initial;
        avatarEl.style.backgroundColor = 'var(--accent)';
        avatarEl.style.color = '#FFFFFF';
      }
      if (mobileAvatarEl) {
        mobileAvatarEl.textContent = initial;
        mobileAvatarEl.style.backgroundColor = 'var(--accent)';
        mobileAvatarEl.style.color = '#FFFFFF';
      }
      if (statusEl) {
        const providerLabel = googleAccount.provider === 'google' ? 'Google' : 'Email';
        statusEl.innerHTML = `<span style="color:#436A57; font-weight:600;">✓ ${providerLabel} Connected</span>`;
      }
    } else {
      if (nameEl) nameEl.textContent = user.name ? `${user.name}'s Daybook` : 'My Daybook';
      const initial = user.name ? user.name.charAt(0).toUpperCase() : 'D';
      if (avatarEl) {
        avatarEl.textContent = initial;
        avatarEl.style.backgroundColor = 'var(--bg-subtle)';
        avatarEl.style.color = 'var(--text-primary)';
      }
      if (mobileAvatarEl) {
        mobileAvatarEl.textContent = initial;
        mobileAvatarEl.style.backgroundColor = 'var(--bg-subtle)';
        mobileAvatarEl.style.color = 'var(--text-primary)';
      }
      if (statusEl) {
        statusEl.innerHTML = `<span style="color:var(--accent); font-weight:500;">Sign in / Sync</span>`;
      }
    }
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const themeIcon = document.getElementById('sidebar-theme-icon');
    const mobileThemeIcon = document.getElementById('mobile-theme-icon');
    const mobileThemeLabel = document.getElementById('mobile-theme-label');

    const sunSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    const moonSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

    if (themeIcon) {
      themeIcon.innerHTML = theme === 'dark' ? sunSvg : moonSvg;
    }
    if (mobileThemeIcon) {
      mobileThemeIcon.innerHTML = theme === 'dark' ? sunSvg : moonSvg;
    }
    if (mobileThemeLabel) {
      mobileThemeLabel.textContent = theme === 'dark' ? 'Warm Paper' : 'Deep Espresso';
    }
  }

  initMobileSheets() {
    const qcSheet = document.getElementById('quick-create-sheet');
    const qcBackdrop = document.getElementById('quick-create-backdrop');
    const moreSheet = document.getElementById('more-menu-sheet');
    const moreBackdrop = document.getElementById('more-menu-backdrop');

    const closeAllSheets = () => {
      qcSheet?.classList.remove('open');
      qcBackdrop?.classList.remove('visible');
      moreSheet?.classList.remove('open');
      moreBackdrop?.classList.remove('visible');
    };

    // FAB quick create button
    document.getElementById('mobile-fab')?.addEventListener('click', () => {
      closeAllSheets();
      qcBackdrop?.classList.add('visible');
      qcSheet?.classList.add('open');
    });

    document.getElementById('quick-create-close')?.addEventListener('click', closeAllSheets);
    qcBackdrop?.addEventListener('click', closeAllSheets);

    document.getElementById('qc-new-task-btn')?.addEventListener('click', () => {
      closeAllSheets();
      this.openTaskModal();
    });

    document.getElementById('qc-new-journal-btn')?.addEventListener('click', () => {
      closeAllSheets();
      this.openJournalEditor();
    });

    // More navigation menu sheet
    document.getElementById('mobile-more-btn')?.addEventListener('click', () => {
      closeAllSheets();
      moreBackdrop?.classList.add('visible');
      moreSheet?.classList.add('open');
    });

    document.getElementById('more-menu-close')?.addEventListener('click', closeAllSheets);
    moreBackdrop?.addEventListener('click', closeAllSheets);

    // More sheet navigation links
    document.querySelectorAll('[data-more-nav]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetView = btn.getAttribute('data-more-nav');
        closeAllSheets();
        this.navigate(targetView);
      });
    });

    // Theme toggle in mobile more sheet
    document.getElementById('mobile-theme-toggle')?.addEventListener('click', () => {
      const cur = store.getUserSettings();
      const nextTheme = cur.theme === 'dark' ? 'light' : 'dark';
      store.updateUserSettings({ theme: nextTheme });
      this.applyTheme(nextTheme);
      toast.info(`Switched to ${nextTheme === 'dark' ? 'Deep Espresso' : 'Warm Paper'} mode`);
    });

    // Account toggle in mobile more sheet
    document.getElementById('mobile-account-toggle')?.addEventListener('click', () => {
      closeAllSheets();
      openGoogleSignInModal(() => {
        this.updateSidebarUserProfile();
        this.renderCurrentView();
      });
    });
  }

  bindNavigation() {
    // Sidebar nav buttons
    const navButtons = document.querySelectorAll('.sidebar-nav-btn[data-nav]');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetView = btn.getAttribute('data-nav');
        this.navigate(targetView);
        this.closeMobileSidebar();
      });
    });

    // Mobile bottom navigation items
    const mobileBottomItems = document.querySelectorAll('.mobile-nav-item[data-nav]');
    mobileBottomItems.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetView = btn.getAttribute('data-nav');
        this.navigate(targetView);
      });
    });
  }

  navigate(viewName) {
    if (!this.views[viewName]) return;
    this.currentView = viewName;

    // Update active nav button in sidebar
    document.querySelectorAll('.sidebar-nav-btn').forEach(btn => {
      if (btn.getAttribute('data-nav') === viewName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update active nav item in mobile bottom navigation
    document.querySelectorAll('.mobile-nav-item[data-nav]').forEach(item => {
      if (item.getAttribute('data-nav') === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Highlight "More" if in a secondary view
    const moreBtn = document.getElementById('mobile-more-btn');
    if (moreBtn) {
      if (['plan', 'progress', 'settings'].includes(viewName)) {
        moreBtn.classList.add('active');
      } else {
        moreBtn.classList.remove('active');
      }
    }

    // Scroll main window to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    this.renderCurrentView();
  }

  renderCurrentView() {
    if (this.views[this.currentView]) {
      this.views[this.currentView].render();
    }
  }

  openJournalEditor(entryId = null, initialDate = null) {
    this.navigate('journal');
    if (entryId) {
      this.views.journal.setOpenEntry(entryId);
    } else {
      this.views.journal.currentEntryId = null;
      this.views.journal.mode = 'editor';
      this.views.journal.render();
      if (initialDate) {
        const dInput = document.getElementById('entry-date-input');
        if (dInput) dInput.value = initialDate;
      }
    }
  }

  openTaskModal(taskId = null, initialDate = null) {
    const isEdit = !!taskId;
    const task = isEdit ? store.getTaskById(taskId) : null;
    const categories = store.getCategories();
    const todayStr = getTodayString();

    const titleVal = task ? task.title : '';
    const dateVal = task ? task.dueDate : (initialDate || todayStr);
    const timeVal = task ? (task.dueTime || '') : '';
    const priorityVal = task ? task.priority : 'medium';
    const categoryVal = task ? task.category : 'personal';
    const notesVal = task ? (task.notes || '') : '';

    const content = `
      <form id="task-modal-form" class="task-modal-form">
        <div class="form-group">
          <label for="task-form-title" class="form-label">Task Description *</label>
          <input type="text" id="task-form-title" class="form-input" placeholder="e.g., Draft design system tokens" value="${escapeHtml(titleVal)}" required autofocus maxlength="150" />
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label for="task-form-date" class="form-label">Due Date</label>
            <input type="date" id="task-form-date" class="form-input" value="${dateVal}" required />
          </div>

          <div class="form-group">
            <label for="task-form-time" class="form-label">Due Time (Optional)</label>
            <input type="time" id="task-form-time" class="form-input" value="${timeVal}" />
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label for="task-form-priority" class="form-label">Priority</label>
            <select id="task-form-priority" class="form-select">
              <option value="high" ${priorityVal === 'high' ? 'selected' : ''}>High Priority</option>
              <option value="medium" ${priorityVal === 'medium' ? 'selected' : ''}>Medium Priority</option>
              <option value="low" ${priorityVal === 'low' ? 'selected' : ''}>Low Priority</option>
            </select>
          </div>

          <div class="form-group">
            <label for="task-form-category" class="form-label">Category</label>
            <select id="task-form-category" class="form-select">
              ${categories.map(c => `
                <option value="${c.id}" ${categoryVal === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="task-form-notes" class="form-label">Notes & Details (Optional)</label>
          <textarea id="task-form-notes" class="form-textarea" rows="3" placeholder="Context, links, steps, or prerequisites...">${escapeHtml(notesVal)}</textarea>
        </div>
      </form>
    `;

    const footer = `
      <button type="button" class="btn btn-secondary modal-cancel-btn">Cancel</button>
      <button type="button" class="btn btn-primary modal-save-task-btn">${isEdit ? 'Save Changes' : 'Create Task'}</button>
    `;

    modal.open(isEdit ? 'Edit Task' : 'Create New Task', content, {
      maxWidth: '500px',
      footerHtml: footer,
      onMount: (overlay) => {
        const form = overlay.querySelector('#task-modal-form');
        const saveBtn = overlay.querySelector('.modal-save-task-btn');
        const cancelBtn = overlay.querySelector('.modal-cancel-btn');

        cancelBtn.onclick = () => modal.close();

        const submitTask = () => {
          const title = overlay.querySelector('#task-form-title').value.trim();
          const dueDate = overlay.querySelector('#task-form-date').value || todayStr;
          const dueTime = overlay.querySelector('#task-form-time').value || '';
          const priority = overlay.querySelector('#task-form-priority').value;
          const category = overlay.querySelector('#task-form-category').value;
          const notes = overlay.querySelector('#task-form-notes').value.trim();

          if (!title) {
            toast.warning('Please enter a task description');
            overlay.querySelector('#task-form-title').focus();
            return;
          }

          if (isEdit) {
            store.updateTask(taskId, {
              title,
              dueDate,
              dueTime,
              priority,
              category,
              notes
            });
            toast.success('Task updated');
          } else {
            store.addTask({
              title,
              dueDate,
              dueTime,
              priority,
              category,
              notes
            });
            toast.success('Task created');
          }

          modal.close();
        };

        saveBtn.onclick = submitTask;
        form.onsubmit = (e) => {
          e.preventDefault();
          submitTask();
        };
      }
    });
  }

  toggleMobileSidebar() {
    this.sidebar?.classList.toggle('open');
    this.sidebarOverlay?.classList.toggle('visible');
  }

  closeMobileSidebar() {
    this.sidebar?.classList.remove('open');
    this.sidebarOverlay?.classList.remove('visible');
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

// Start app on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});

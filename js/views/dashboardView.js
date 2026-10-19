/**
 * Dashboard View for Daybook
 */
import { store } from '../store.js';
import { formatDisplayDate, getTodayString, getGreetingDetails, formatLiveClock, formatTime } from '../utils/dateUtils.js';
import { firePaperConfetti } from '../utils/confetti.js';
import { attach3DTilt, attachButtonRipples, animateNumberCounter } from '../utils/interactiveFX.js';

export class DashboardView {
  constructor({ container, onNavigate, onOpenTaskModal, onOpenJournalEditor }) {
    this.container = container;
    this.onNavigate = onNavigate;
    this.onOpenTaskModal = onOpenTaskModal;
    this.onOpenJournalEditor = onOpenJournalEditor;
    this.clockInterval = null;
  }

  render() {
    const now = new Date();
    const todayStr = getTodayString();
    const user = store.getUserSettings();
    const greetingDetails = getGreetingDetails(now);
    const formattedDate = formatDisplayDate(now, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const formattedTime = formatLiveClock(now, true);
    const quote = store.getRandomQuote();
    const taskStats = store.getTaskStats(todayStr);
    const todayTasks = store.getTasksForDate(todayStr);
    const todayPlan = store.getDailyPlan(todayStr);
    const writingStats = store.getWritingStats();
    
    // Latest journal entry
    const allEntries = store.getJournalEntries();
    const latestEntry = allEntries.length > 0 ? allEntries[0] : null;

    const isDemo = user.isDemoLoaded === true;
    const displayName = user.name ? `, ${escapeHtml(user.name)}` : '';

    this.container.innerHTML = `
      <div class="view-content dashboard-view">
        ${isDemo ? `
          <div class="demo-active-banner animate-fade-in">
            <div class="demo-banner-content">
              <span class="demo-badge">Demo Mode</span>
              <p class="demo-banner-text">You are currently previewing sample data. You can explore freely or start completely fresh.</p>
            </div>
            <button class="btn btn-sm btn-secondary demo-clear-btn" id="dash-clear-demo-btn">Switch to Clean Workspace</button>
          </div>
        ` : ''}

        <!-- Top Editorial Header & Greeting with Live Real-Time & Date -->
        <header class="dashboard-header">
          <div class="header-intro">
            <div class="header-datetime-row">
              <span class="header-date-badge" id="dash-live-date">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span class="live-date-val">${formattedDate}</span>
              </span>
            </div>
            <h1 class="header-greeting" id="dash-live-greeting">
              <span class="greeting-text">${greetingDetails.greeting}</span>${displayName}
            </h1>
            <p class="header-subtext" id="dash-live-subtext">${greetingDetails.message}</p>
          </div>

          <!-- Daily Quote Banner -->
          <div class="quote-card">
            <div class="quote-mark">“</div>
            <div class="quote-content">
              <p class="quote-text">${escapeHtml(quote.text)}</p>
              <span class="quote-author">— ${escapeHtml(quote.author)}</span>
            </div>
            <button class="quote-refresh-btn" title="New daily reflection quote" aria-label="Refresh quote">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            </button>
          </div>
        </header>

        <!-- Quick Actions Row -->
        <div class="quick-actions-bar">
          <button class="btn btn-primary action-btn" id="dash-quick-task">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Task
          </button>
          <button class="btn btn-secondary action-btn" id="dash-quick-journal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Write Entry
          </button>
          <button class="btn btn-secondary action-btn" id="dash-quick-plan">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
            Daily Plan & MITs
          </button>
          <button class="btn btn-secondary action-btn" id="dash-quick-calendar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            View Calendar
          </button>
        </div>

        <!-- Metric Stat Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-meta">
              <span class="stat-label">Today's Progress</span>
              <span class="stat-sub">${taskStats.completed} of ${taskStats.total} done</span>
            </div>
            <div class="stat-value" id="dash-stat-pct">${taskStats.percentage}%</div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill" style="width: ${taskStats.percentage}%"></div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-meta">
              <span class="stat-label">Tasks Remaining</span>
              <span class="stat-sub">${taskStats.completed} completed</span>
            </div>
            <div class="stat-value" id="dash-stat-rem">${taskStats.remaining}</div>
            <span class="stat-note">${taskStats.remaining === 0 && taskStats.total > 0 ? '✨ All caught up!' : 'Tasks due today'}</span>
          </div>

          <div class="stat-card">
            <div class="stat-meta">
              <span class="stat-label">Journal Streak</span>
              <span class="stat-sub">Consecutive days</span>
            </div>
            <div class="stat-value"><span id="dash-stat-streak">${writingStats.currentStreak}</span> <span class="stat-unit">days</span></div>
            <span class="stat-note">Longest: ${writingStats.longestStreak} days</span>
          </div>

          <div class="stat-card">
            <div class="stat-meta">
              <span class="stat-label">Words Chronicled</span>
              <span class="stat-sub">${writingStats.totalEntries} entries total</span>
            </div>
            <div class="stat-value" id="dash-stat-words">${writingStats.totalWords.toLocaleString()}</div>
            <span class="stat-note">Personal thoughts saved</span>
          </div>
        </div>

        <!-- 2-Column Main Dashboard Layout -->
        <div class="dashboard-grid">
          <!-- Left Column: Today's Tasks & Priorities -->
          <div class="dashboard-col">
            <!-- Top 3 MITs Card -->
            <div class="card dashboard-card">
              <div class="card-header">
                <div class="card-title-group">
                  <span class="card-eyebrow">The Rule of 3</span>
                  <h2 class="card-title">Top Priorities for Today</h2>
                </div>
                <button class="btn btn-text card-link-btn" id="dash-manage-plan">Edit Plan →</button>
              </div>

              <div class="mit-list">
                ${this.renderTopThree(todayPlan.topThree)}
              </div>
            </div>

            <!-- Today's To-Do List Card -->
            <div class="card dashboard-card">
              <div class="card-header">
                <div class="card-title-group">
                  <span class="card-eyebrow">To-Do List</span>
                  <h2 class="card-title">Today's Schedule & Tasks</h2>
                </div>
                <button class="btn btn-text card-link-btn" id="dash-all-tasks">View All Tasks (${store.getTasks().length}) →</button>
              </div>

              <div class="dash-task-list">
                ${this.renderTodayTasks(todayTasks)}
              </div>
            </div>
          </div>

          <!-- Right Column: Journal Entry & Focus -->
          <div class="dashboard-col">
            <!-- Morning Intention / Focus Card -->
            <div class="card dashboard-card intention-card">
              <div class="card-header">
                <div class="card-title-group">
                  <span class="card-eyebrow">Daily Focus</span>
                  <h2 class="card-title">Morning Intention</h2>
                </div>
                <span class="focus-word-pill">${todayPlan.focusWord ? `Focus: ${escapeHtml(todayPlan.focusWord)}` : 'Set a focus word'}</span>
              </div>
              <p class="intention-body">
                ${todayPlan.morningIntention ? `“${escapeHtml(todayPlan.morningIntention)}”` : 'Take a moment to define what mindset or focus will guide your actions today.'}
              </p>
            </div>

            <!-- Latest Journal Card -->
            <div class="card dashboard-card">
              <div class="card-header">
                <div class="card-title-group">
                  <span class="card-eyebrow">Personal Journal</span>
                  <h2 class="card-title">Latest Reflection</h2>
                </div>
                <button class="btn btn-text card-link-btn" id="dash-write-journal-top">+ New Entry</button>
              </div>

              ${latestEntry ? this.renderLatestEntry(latestEntry) : `
                <div class="empty-state">
                  <div class="empty-icon">📖</div>
                  <h3 class="empty-title">Your page is waiting</h3>
                  <p class="empty-text">Writing down your thoughts brings peace, perspective, and clarity to your day.</p>
                  <button class="btn btn-primary" id="dash-empty-journal-btn">Write First Entry</button>
                </div>
              `}
            </div>

            <!-- Mini Time-Block Schedule -->
            <div class="card dashboard-card">
              <div class="card-header">
                <div class="card-title-group">
                  <span class="card-eyebrow">Timeline</span>
                  <h2 class="card-title">Today's Schedule Blocks</h2>
                </div>
                <button class="btn btn-text card-link-btn" id="dash-edit-schedule">Manage →</button>
              </div>

              <div class="schedule-blocks-list">
                ${this.renderTimeBlocks(todayPlan.timeBlocks)}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  renderTopThree(topThree) {
    if (!topThree || topThree.length === 0) {
      return `
        <div class="empty-hint-card">
          <p>No primary goals set for today yet.</p>
          <button class="btn btn-sm btn-secondary" id="dash-set-mit-btn">Set Today's 3 Goals</button>
        </div>
      `;
    }

    return topThree.map((mit, idx) => `
      <div class="mit-item ${mit.completed ? 'completed' : ''}" data-mit-id="${mit.id}">
        <div class="mit-number">0${idx + 1}</div>
        <div class="mit-content">
          <span class="mit-text">${escapeHtml(mit.text)}</span>
        </div>
        <button class="task-checkbox-btn ${mit.completed ? 'checked' : ''}" data-action="toggle-mit" data-idx="${idx}" aria-label="Toggle MIT completion">
          ${mit.completed ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
        </button>
      </div>
    `).join('');
  }

  renderTodayTasks(tasks) {
    if (!tasks || tasks.length === 0) {
      return `
        <div class="empty-hint-card">
          <p>No tasks scheduled for today. Enjoy the open space or add a task to get started.</p>
          <button class="btn btn-sm btn-secondary" id="dash-add-first-task">+ Add Task for Today</button>
        </div>
      `;
    }

    return tasks.map(task => {
      const priorityClass = `priority-${task.priority}`;
      const timeStr = task.dueTime ? formatTime(task.dueTime) : '';

      return `
        <div class="task-row ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
          <button class="task-checkbox-btn ${task.completed ? 'checked' : ''}" data-action="toggle-task" data-id="${task.id}" aria-label="Mark task complete">
            ${task.completed ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
          </button>
          <div class="task-info">
            <span class="task-title">${escapeHtml(task.title)}</span>
            <div class="task-meta-tags">
              <span class="priority-tag ${priorityClass}">${capitalize(task.priority)}</span>
              <span class="category-tag category-${task.category}">${capitalize(task.category)}</span>
              ${timeStr ? `<span class="time-tag"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${timeStr}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderLatestEntry(entry) {
    const formattedDate = formatDisplayDate(entry.date, { month: 'short', day: 'numeric', year: 'numeric' });
    const excerpt = entry.content.replace(/<[^>]+>/g, ' ').substring(0, 160).trim() + '...';
    const moodEmojis = {
      peaceful: '😌 Peaceful',
      productive: '⚡ Productive',
      thoughtful: '🤔 Thoughtful',
      energetic: '🔥 Energetic',
      low: '🌧️ Gentle day'
    };

    return `
      <div class="latest-entry-card" data-entry-id="${entry.id}">
        <div class="entry-card-meta">
          <span class="entry-date">${formattedDate} at ${formatTime(entry.time)}</span>
          <span class="entry-mood-tag">${moodEmojis[entry.mood] || '📝 Reflection'}</span>
        </div>
        <h3 class="entry-card-title">${escapeHtml(entry.title)}</h3>
        <p class="entry-card-snippet">${escapeHtml(excerpt)}</p>
        <div class="entry-card-footer">
          <span class="entry-stats-tag">${entry.wordCount || 0} words • ${entry.readingTime || 1} min read</span>
          <button class="btn btn-text read-entry-btn" data-entry-id="${entry.id}">Read & Edit →</button>
        </div>
      </div>
    `;
  }

  renderTimeBlocks(blocks) {
    if (!blocks || blocks.length === 0) {
      return `<p class="empty-hint">No scheduled time blocks set for today yet.</p>`;
    }

    return blocks.map(block => `
      <div class="time-block-pill">
        <span class="time-block-time">${formatTime(block.startTime)} – ${formatTime(block.endTime)}</span>
        <span class="time-block-title">${escapeHtml(block.title)}</span>
        <span class="category-pill-label" style="font-size: 11px;">${capitalize(block.category || 'Focus')}</span>
      </div>
    `).join('');
  }

  bindEvents() {
    // Quick action buttons
    this.container.querySelector('#dash-quick-task')?.addEventListener('click', () => this.onOpenTaskModal());
    this.container.querySelector('#dash-quick-journal')?.addEventListener('click', () => this.onOpenJournalEditor());
    this.container.querySelector('#dash-quick-plan')?.addEventListener('click', () => this.onNavigate('plan'));
    this.container.querySelector('#dash-quick-calendar')?.addEventListener('click', () => this.onNavigate('calendar'));

    this.container.querySelector('#dash-clear-demo-btn')?.addEventListener('click', () => {
      store.clearAllData();
      toast.success('Clean workspace activated.');
    });

    // Card link buttons
    this.container.querySelector('#dash-manage-plan')?.addEventListener('click', () => this.onNavigate('plan'));
    this.container.querySelector('#dash-all-tasks')?.addEventListener('click', () => this.onNavigate('tasks'));
    this.container.querySelector('#dash-write-journal-top')?.addEventListener('click', () => this.onOpenJournalEditor());
    this.container.querySelector('#dash-edit-schedule')?.addEventListener('click', () => this.onNavigate('plan'));
    this.container.querySelector('#dash-empty-journal-btn')?.addEventListener('click', () => this.onOpenJournalEditor());
    this.container.querySelector('#dash-set-mit-btn')?.addEventListener('click', () => this.onNavigate('plan'));
    this.container.querySelector('#dash-add-first-task')?.addEventListener('click', () => this.onOpenTaskModal());

    // Quote refresh button with spin & fade animation
    const refreshBtn = this.container.querySelector('.quote-refresh-btn');
    refreshBtn?.addEventListener('click', () => {
      refreshBtn.classList.add('spinning');
      const q = store.getRandomQuote();
      const quoteText = this.container.querySelector('.quote-text');
      const quoteAuthor = this.container.querySelector('.quote-author');
      if (quoteText && quoteAuthor) {
        quoteText.classList.remove('animate-fade');
        void quoteText.offsetWidth; // trigger reflow
        quoteText.textContent = q.text;
        quoteText.classList.add('animate-fade');
        quoteAuthor.textContent = `— ${q.author}`;
      }
      setTimeout(() => refreshBtn.classList.remove('spinning'), 550);
    });

    // Task checkbox toggle with celebration only when all daily tasks are completed
    this.container.querySelectorAll('[data-action="toggle-task"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const updated = store.toggleTask(id);
        if (updated && updated.completed) {
          const stats = store.getTaskStats(getTodayString());
          if (stats.total > 0 && stats.remaining === 0) {
            firePaperConfetti(e.clientX, e.clientY, 25);
          }
        }
      });
    });

    // Top 3 MIT toggle with celebration only when all daily tasks are completed
    this.container.querySelectorAll('[data-action="toggle-mit"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const todayStr = getTodayString();
        const plan = store.getDailyPlan(todayStr);
        if (plan && plan.topThree && plan.topThree[idx]) {
          plan.topThree[idx].completed = !plan.topThree[idx].completed;
          if (plan.topThree[idx].taskId) {
            store.toggleTask(plan.topThree[idx].taskId);
          }
          store.saveDailyPlan(todayStr, { topThree: plan.topThree });
          if (plan.topThree[idx].completed) {
            const stats = store.getTaskStats(todayStr);
            if (stats.total > 0 && stats.remaining === 0) {
              firePaperConfetti(e.clientX, e.clientY, 25);
            }
          }
        }
      });
    });

    // Read latest entry
    this.container.querySelectorAll('.read-entry-btn, .latest-entry-card').forEach(el => {
      el.addEventListener('click', (e) => {
        const id = el.getAttribute('data-entry-id');
        if (id) {
          this.onOpenJournalEditor(id);
        }
      });
    });

    // Animate stats number roll-up with short, snappy durations
    const todayStr = getTodayString();
    const taskStats = store.getTaskStats(todayStr);
    const writingStats = store.getWritingStats();

    animateNumberCounter(this.container.querySelector('#dash-stat-pct'), taskStats.percentage, 320, '', '%');
    animateNumberCounter(this.container.querySelector('#dash-stat-rem'), taskStats.remaining, 280);
    animateNumberCounter(this.container.querySelector('#dash-stat-streak'), writingStats.currentStreak, 300);
    animateNumberCounter(this.container.querySelector('#dash-stat-words'), writingStats.totalWords, 350);

    // Attach 3D tilt on cards and click ripples
    attach3DTilt(this.container.querySelectorAll('.stat-card, .quote-card, .latest-entry-card, .mit-item'));
    attachButtonRipples(this.container);

    // Dynamic greeting & date ticker
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
    this.clockInterval = setInterval(() => {
      const cur = new Date();
      const dateVal = this.container.querySelector('.live-date-val');
      const greetingText = this.container.querySelector('.greeting-text');
      const greetingEmoji = this.container.querySelector('#dash-live-emoji');
      const subtext = this.container.querySelector('#dash-live-subtext');

      const info = getGreetingDetails(cur);
      if (greetingText && greetingText.textContent !== info.greeting) {
        greetingText.textContent = info.greeting;
        if (subtext) subtext.textContent = info.message;
      }

      if (dateVal && cur.getSeconds() === 0) {
        dateVal.textContent = formatDisplayDate(cur, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      }
    }, 10000);
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

function capitalize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

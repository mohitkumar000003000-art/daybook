/**
 * Calendar View for Daybook
 * Monthly and Weekly views, date-cell event badges, day inspection panel,
 * and direct creation of tasks and journals for selected dates.
 */
import { store } from '../store.js';
import { 
  getCalendarGrid, 
  getWeekDaysFor, 
  formatMonthYear, 
  formatDisplayDate, 
  formatISODate, 
  getTodayString, 
  isToday, 
  formatTime 
} from '../utils/dateUtils.js';
import { attachButtonRipples, attach3DTilt } from '../utils/interactiveFX.js';

export class CalendarView {
  constructor({ container, onOpenTaskModal, onOpenJournalEditor }) {
    this.container = container;
    this.onOpenTaskModal = onOpenTaskModal;
    this.onOpenJournalEditor = onOpenJournalEditor;

    const now = new Date();
    this.currentYear = now.getFullYear();
    this.currentMonth = now.getMonth(); // 0-indexed
    this.selectedDateStr = getTodayString();
    this.calendarMode = 'month'; // 'month' or 'week'
  }

  render() {
    const todayStr = getTodayString();
    const monthYearTitle = formatMonthYear(this.currentYear, this.currentMonth);
    const dayTasks = store.getTasksForDate(this.selectedDateStr);
    const dayEntries = store.getJournalEntriesForDate(this.selectedDateStr);
    const dayPlan = store.getDailyPlan(this.selectedDateStr);
    const selectedDateDisplay = formatDisplayDate(this.selectedDateStr, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    this.container.innerHTML = `
      <div class="view-content calendar-view">
        <!-- Calendar Header -->
        <header class="view-header">
          <div class="view-header-title">
            <span class="card-eyebrow">Calendar & Archive</span>
            <h1 class="page-title">Temporal Overview</h1>
            <p class="page-subtext">View your tasks and reflective writings across time. Inspect any past day or plan ahead.</p>
          </div>
          <div class="view-header-actions">
            <!-- Mode Toggle: Month / Week / Agenda -->
            <div class="btn-group cal-mode-group">
              <button class="btn btn-sm ${this.calendarMode === 'month' ? 'btn-primary' : 'btn-secondary'}" id="cal-mode-month">Month</button>
              <button class="btn btn-sm ${this.calendarMode === 'week' ? 'btn-primary' : 'btn-secondary'}" id="cal-mode-week">Week</button>
              <button class="btn btn-sm ${this.calendarMode === 'agenda' ? 'btn-primary' : 'btn-secondary'}" id="cal-mode-agenda">Agenda</button>
            </div>
            <button class="btn btn-secondary btn-sm cal-today-action-btn" id="cal-today-btn">Today</button>
          </div>
        </header>

        <!-- Main Calendar Split Layout -->
        <div class="calendar-layout-grid">
          <!-- Left: Calendar Grid -->
          <div class="calendar-main-card card">
            <!-- Month / Navigation Toolbar -->
            <div class="calendar-nav-toolbar">
              <div class="cal-nav-buttons">
                <button class="icon-btn" id="cal-prev-btn" title="Previous" aria-label="Previous">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <h2 class="cal-current-label">${monthYearTitle}</h2>
                <button class="icon-btn" id="cal-next-btn" title="Next" aria-label="Next">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>

              <div class="cal-legend-row">
                <span class="cal-legend-chip"><span class="legend-pip task-pip"></span> Tasks</span>
                <span class="cal-legend-chip"><span class="legend-pip journal-pip"></span> Journal</span>
              </div>
            </div>

            <!-- Calendar Display: Month, Week, or Agenda -->
            ${this.calendarMode === 'month' ? this.renderMonthGrid() : (this.calendarMode === 'week' ? this.renderWeekGrid() : this.renderAgendaView())}
          </div>

          <!-- Right: Day Inspector Panel -->
          <aside class="calendar-day-inspector card">
            <div class="inspector-header">
              <div class="inspector-date-info">
                <span class="inspector-tag">${isToday(this.selectedDateStr) ? 'Today' : 'Selected Date'}</span>
                <h3 class="inspector-date-title">${selectedDateDisplay}</h3>
              </div>
            </div>

            <!-- Quick Creation Actions for Selected Date -->
            <div class="inspector-actions">
              <button class="btn btn-sm btn-primary w-100" id="inspector-add-task-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Task for this Day
              </button>
              <button class="btn btn-sm btn-secondary w-100" id="inspector-add-journal-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Write Journal for this Day
              </button>
            </div>

            <hr class="modal-divider" />

            <!-- Day's Tasks Section -->
            <div class="inspector-section">
              <div class="inspector-section-header">
                <h4 class="inspector-section-title">Tasks (${dayTasks.length})</h4>
                <span class="inspector-completion-stat">
                  ${dayTasks.filter(t => t.completed).length}/${dayTasks.length} done
                </span>
              </div>

              <div class="inspector-tasks-list">
                ${dayTasks.length === 0 ? `<p class="empty-hint">No tasks scheduled for this day.</p>` : `
                  ${dayTasks.map(task => `
                    <div class="inspector-task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                      <button class="task-checkbox-btn ${task.completed ? 'checked' : ''}" data-action="toggle-task" data-id="${task.id}" aria-label="Toggle task">
                        ${task.completed ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
                      </button>
                      <div class="inspector-task-text">
                        <span class="itask-title">${escapeHtml(task.title)}</span>
                        ${task.dueTime ? `<span class="itask-time">${formatTime(task.dueTime)}</span>` : ''}
                      </div>
                    </div>
                  `).join('')}
                `}
              </div>
            </div>

            <hr class="modal-divider" />

            <!-- Day's Journal Entries Section -->
            <div class="inspector-section">
              <div class="inspector-section-header">
                <h4 class="inspector-section-title">Journal Entries (${dayEntries.length})</h4>
              </div>

              <div class="inspector-entries-list">
                ${dayEntries.length === 0 ? `<p class="empty-hint">No journal entries written on this day.</p>` : `
                  ${dayEntries.map(entry => `
                    <div class="inspector-entry-card" data-entry-id="${entry.id}">
                      <div class="ientry-meta">
                        <span class="ientry-time">${formatTime(entry.time)}</span>
                        <span class="ientry-words">${entry.wordCount || 0} words</span>
                      </div>
                      <h5 class="ientry-title">${escapeHtml(entry.title)}</h5>
                      <p class="ientry-snippet">${escapeHtml(entry.content.replace(/<[^>]+>/g, ' ').substring(0, 90).trim() + '...')}</p>
                      <button class="btn btn-text btn-xs read-inspector-entry" data-entry-id="${entry.id}">Open Entry →</button>
                    </div>
                  `).join('')}
                `}
              </div>
            </div>

            <!-- Morning Intention / Evening Note if present -->
            ${(dayPlan && (dayPlan.morningIntention || (dayPlan.eveningReflection && dayPlan.eveningReflection.wins))) ? `
              <hr class="modal-divider" />
              <div class="inspector-section">
                <h4 class="inspector-section-title">Daily Plan Highlights</h4>
                ${dayPlan.morningIntention ? `
                  <div class="inspector-plan-highlight">
                    <span class="plan-hl-label">Morning Intention:</span>
                    <p class="plan-hl-text">“${escapeHtml(dayPlan.morningIntention)}”</p>
                  </div>
                ` : ''}
                ${dayPlan.eveningReflection && dayPlan.eveningReflection.wins ? `
                  <div class="inspector-plan-highlight">
                    <span class="plan-hl-label">Evening Win:</span>
                    <p class="plan-hl-text">${escapeHtml(dayPlan.eveningReflection.wins)}</p>
                  </div>
                ` : ''}
              </div>
            ` : ''}
          </aside>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  renderMonthGrid() {
    const grid = getCalendarGrid(this.currentYear, this.currentMonth);
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const headerRow = dayNames.map(d => `<div class="cal-col-header">${d}</div>`).join('');

    const daysHtml = grid.map(cell => {
      const isSelected = cell.dateString === this.selectedDateStr;
      const isTodayCell = isToday(cell.dateString);
      const tasks = store.getTasksForDate(cell.dateString);
      const entries = store.getJournalEntriesForDate(cell.dateString);

      const hasTasks = tasks.length > 0;
      const allTasksCompleted = hasTasks && tasks.every(t => t.completed);
      const hasJournal = entries.length > 0;

      let cellClass = 'cal-day-cell';
      if (!cell.isCurrentMonth) cellClass += ' cal-day-outside';
      if (isSelected) cellClass += ' cal-day-selected';
      if (isTodayCell) cellClass += ' cal-day-today';

      return `
        <div class="${cellClass}" data-date="${cell.dateString}" tabindex="0" role="button" aria-label="${cell.dateString}">
          <div class="cal-cell-header">
            <span class="cal-day-num">${cell.dayNumber}</span>
            ${isTodayCell ? `<span class="cal-today-dot"></span>` : ''}
          </div>

          <div class="cal-indicators">
            ${hasTasks ? `
              <div class="cal-indicator-chip ${allTasksCompleted ? 'task-chip-done' : 'task-chip-pending'}">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                ${tasks.length}
              </div>
            ` : ''}

            ${hasJournal ? `
              <div class="cal-indicator-chip journal-chip" title="${entries.length} journal entries">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                ${entries.length}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="cal-grid-container">
        <div class="cal-days-header-row">${headerRow}</div>
        <div class="cal-month-grid">${daysHtml}</div>
      </div>
    `;
  }

  renderWeekGrid() {
    const selectedDateObj = new Date(this.selectedDateStr);
    const weekDays = getWeekDaysFor(selectedDateObj);

    return `
      <div class="cal-week-grid-container">
        <div class="cal-week-grid">
          ${weekDays.map(d => {
            const dateStr = formatISODate(d);
            const isSelected = dateStr === this.selectedDateStr;
            const isTodayCell = isToday(dateStr);
            const tasks = store.getTasksForDate(dateStr);
            const entries = store.getJournalEntriesForDate(dateStr);
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = d.getDate();

            return `
              <div class="cal-week-column ${isSelected ? 'week-col-selected' : ''} ${isTodayCell ? 'week-col-today' : ''}" data-date="${dateStr}">
                <div class="cal-week-col-header">
                  <span class="week-day-name">${dayName}</span>
                  <span class="week-day-num">${dayNum}</span>
                </div>

                <div class="cal-week-body">
                  <div class="week-section">
                    <span class="week-section-title">Tasks (${tasks.length})</span>
                    ${tasks.length === 0 ? `<span class="week-empty-text">No tasks</span>` : `
                      ${tasks.slice(0, 4).map(t => `
                        <div class="week-task-item ${t.completed ? 'completed' : ''}">
                          <span class="wt-pip ${t.completed ? 'pip-done' : ''}"></span>
                          <span class="wt-title">${escapeHtml(t.title)}</span>
                        </div>
                      `).join('')}
                      ${tasks.length > 4 ? `<span class="more-items-text">+${tasks.length - 4} more</span>` : ''}
                    `}
                  </div>

                  <div class="week-section">
                    <span class="week-section-title">Journal (${entries.length})</span>
                    ${entries.length === 0 ? `<span class="week-empty-text">No entry</span>` : `
                      ${entries.map(e => `
                        <div class="week-journal-item" data-entry-id="${e.id}">
                          <span class="wj-icon">📖</span>
                          <span class="wj-title">${escapeHtml(e.title)}</span>
                        </div>
                      `).join('')}
                    `}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  renderAgendaView() {
    // Collect next 14 days or days of the current month that have tasks or journal entries
    const daysWithContent = [];
    const todayStr = getTodayString();
    
    // Scan all tasks & entries to collect active dates
    const dateMap = new Map();
    const allTasks = store.getTasks();
    const allEntries = store.getJournalEntries();

    allTasks.forEach(t => {
      if (!t.dueDate) return;
      if (!dateMap.has(t.dueDate)) dateMap.set(t.dueDate, { tasks: [], entries: [] });
      dateMap.get(t.dueDate).tasks.push(t);
    });

    allEntries.forEach(e => {
      if (!e.date) return;
      if (!dateMap.has(e.date)) dateMap.set(e.date, { tasks: [], entries: [] });
      dateMap.get(e.date).entries.push(e);
    });

    // Sort dates
    const sortedDates = Array.from(dateMap.keys()).sort();

    if (sortedDates.length === 0) {
      return `
        <div class="empty-state calendar-agenda-empty">
          <div class="empty-icon">📅</div>
          <h3 class="empty-title">Agenda is Empty</h3>
          <p class="empty-text">No scheduled tasks or reflections recorded yet. Pick any day to plan or write.</p>
        </div>
      `;
    }

    return `
      <div class="calendar-agenda-list">
        ${sortedDates.map(dStr => {
          const item = dateMap.get(dStr);
          const isSelected = dStr === this.selectedDateStr;
          const isTodayItem = isToday(dStr);
          const formatted = formatDisplayDate(dStr, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

          return `
            <div class="agenda-day-card ${isSelected ? 'agenda-selected' : ''}" data-date="${dStr}">
              <div class="agenda-day-header">
                <div class="agenda-day-title-wrap">
                  <span class="agenda-day-date">${formatted}</span>
                  ${isTodayItem ? `<span class="badge-today-pill">Today</span>` : ''}
                </div>
                <span class="agenda-day-stats">${item.tasks.length} tasks • ${item.entries.length} entries</span>
              </div>

              ${item.tasks.length > 0 ? `
                <div class="agenda-tasks-list">
                  ${item.tasks.map(t => `
                    <div class="agenda-task-item ${t.completed ? 'completed' : ''}" data-task-id="${t.id}" style="cursor:pointer">
                      <span class="agenda-task-bullet">•</span>
                      <span class="agenda-task-title">${escapeHtml(t.title)}</span>
                      ${t.dueTime ? `<span class="agenda-task-time">${formatTime(t.dueTime)}</span>` : ''}
                    </div>
                  `).join('')}
                </div>
              ` : ''}

              ${item.entries.length > 0 ? `
                <div class="agenda-entries-list">
                  ${item.entries.map(e => `
                    <div class="agenda-entry-chip" data-entry-id="${e.id}">
                      <span class="agenda-entry-icon">📖</span>
                      <span class="agenda-entry-title">${escapeHtml(e.title || 'Journal Entry')}</span>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  bindEvents() {
    // Mode switcher
    this.container.querySelector('#cal-mode-month')?.addEventListener('click', () => {
      this.calendarMode = 'month';
      this.render();
    });

    this.container.querySelector('#cal-mode-week')?.addEventListener('click', () => {
      this.calendarMode = 'week';
      this.render();
    });

    this.container.querySelector('#cal-mode-agenda')?.addEventListener('click', () => {
      this.calendarMode = 'agenda';
      this.render();
    });

    // Today button
    this.container.querySelector('#cal-today-btn')?.addEventListener('click', () => {
      const now = new Date();
      this.currentYear = now.getFullYear();
      this.currentMonth = now.getMonth();
      this.selectedDateStr = getTodayString();
      this.render();
    });

    // Prev / Next month
    this.container.querySelector('#cal-prev-btn')?.addEventListener('click', () => {
      if (this.calendarMode === 'month') {
        if (this.currentMonth === 0) {
          this.currentMonth = 11;
          this.currentYear--;
        } else {
          this.currentMonth--;
        }
      } else {
        const d = new Date(this.selectedDateStr);
        d.setDate(d.getDate() - 7);
        this.selectedDateStr = formatISODate(d);
        this.currentYear = d.getFullYear();
        this.currentMonth = d.getMonth();
      }
      this.render();
    });

    this.container.querySelector('#cal-next-btn')?.addEventListener('click', () => {
      if (this.calendarMode === 'month') {
        if (this.currentMonth === 11) {
          this.currentMonth = 0;
          this.currentYear++;
        } else {
          this.currentMonth++;
        }
      } else {
        const d = new Date(this.selectedDateStr);
        d.setDate(d.getDate() + 7);
        this.selectedDateStr = formatISODate(d);
        this.currentYear = d.getFullYear();
        this.currentMonth = d.getMonth();
      }
      this.render();
    });

    // Clicking date cells
    this.container.querySelectorAll('[data-date]').forEach(el => {
      el.addEventListener('click', () => {
        const dateStr = el.getAttribute('data-date');
        if (dateStr) {
          this.selectedDateStr = dateStr;
          this.render();
        }
      });
    });

    // Inspector quick task button
    this.container.querySelector('#inspector-add-task-btn')?.addEventListener('click', () => {
      this.onOpenTaskModal(null, this.selectedDateStr);
    });

    // Inspector quick journal button
    this.container.querySelector('#inspector-add-journal-btn')?.addEventListener('click', () => {
      // Create new journal draft for this selected date
      this.onOpenJournalEditor(null, this.selectedDateStr);
    });

    // Inspector task toggle
    this.container.querySelectorAll('[data-action="toggle-task"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        store.toggleTask(id);
        this.render();
      });
    });

    // Inspector & agenda task click to view/edit
    this.container.querySelectorAll('.inspector-task-item, .agenda-task-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-action="toggle-task"]')) return;
        const id = el.getAttribute('data-task-id');
        if (id) {
          this.onOpenTaskModal(id);
        }
      });
    });

    // Inspector entry click
    this.container.querySelectorAll('[data-entry-id]').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-entry-id');
        if (id) {
          this.onOpenJournalEditor(id);
        }
      });
    });

    attachButtonRipples(this.container);
    attach3DTilt(this.container.querySelectorAll('.inspector-entry-card, .inspector-plan-highlight'));
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

/**
 * Daily Planning & Reflection View for Daybook
 * The Rule of 3 (MITs), time-blocking schedule, morning intentions,
 * evening reflections, and 1-click rollover of unfinished tasks.
 */
import { store } from '../store.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { 
  getTodayString, 
  formatDisplayDate, 
  addDays, 
  formatISODate, 
  isToday, 
  formatTime 
} from '../utils/dateUtils.js';
import { firePaperConfetti } from '../utils/confetti.js';
import { attach3DTilt, attachButtonRipples } from '../utils/interactiveFX.js';

export class PlanView {
  constructor({ container, onOpenTaskModal, onOpenJournalEditor }) {
    this.container = container;
    this.onOpenTaskModal = onOpenTaskModal;
    this.onOpenJournalEditor = onOpenJournalEditor;
    this.currentDateStr = getTodayString();
    this.transitionClass = '';
  }

  setDate(dateStr) {
    this.currentDateStr = dateStr;
    this.render();
  }

  render() {
    const todayStr = getTodayString();
    const plan = store.getDailyPlan(this.currentDateStr);
    const dayTasks = store.getTasksForDate(this.currentDateStr);
    const unfinishedTasks = dayTasks.filter(t => !t.completed);
    const dateDisplay = formatDisplayDate(this.currentDateStr, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const isCurrentDateToday = isToday(this.currentDateStr);

    const totalDayTasks = dayTasks.length;
    const doneDayTasks = dayTasks.filter(t => t.completed).length;
    const dayPct = totalDayTasks === 0 ? 0 : Math.round((doneDayTasks / totalDayTasks) * 100);
    const ringRadius = 14;
    const ringCircumference = 2 * Math.PI * ringRadius; // ~87.96
    const ringOffset = ringCircumference * (1 - dayPct / 100);

    const animClass = this.transitionClass;
    this.transitionClass = '';

    this.container.innerHTML = `
      <div class="view-content plan-view ${animClass}">
        <!-- View Header -->
        <header class="view-header">
          <div class="view-header-title">
            <span class="card-eyebrow">Daily Cadence</span>
            <h1 class="page-title">Daily Planning & Reflection</h1>
            <p class="page-subtext">Structure your day around what truly moves the needle, then close the evening with mindful reflection.</p>
          </div>

          <!-- Date Navigation Bar with Progress Ring and Corner Peel Arrows -->
          <div class="plan-date-navigator">
            <button class="icon-btn nav-arrow-peel" id="plan-prev-day-btn" title="Previous Day (Swipe or Click)" aria-label="Previous Day">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div class="plan-date-center">
              <!-- Animated Progress Ring around Date -->
              <div class="date-progress-ring" title="${dayPct}% tasks completed on this day" aria-label="${dayPct}% completed">
                <svg width="36" height="36" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="${ringRadius}" fill="none" stroke="var(--border-subtle)" stroke-width="3" />
                  <circle cx="18" cy="18" r="${ringRadius}" fill="none" stroke="var(--accent)" stroke-width="3" 
                          stroke-dasharray="${ringCircumference.toFixed(1)}" stroke-dashoffset="${ringOffset.toFixed(1)}" 
                          stroke-linecap="round" transform="rotate(-90 18 18)" class="date-progress-circle" />
                </svg>
                <span style="position: absolute; font-size: 10px; font-weight: 700; color: var(--accent);">${dayPct}%</span>
              </div>
              <span class="plan-date-label">${dateDisplay}</span>
              ${isCurrentDateToday ? `<span class="badge-today-pill">Today</span>` : ''}
            </div>
            <button class="icon-btn nav-arrow-peel" id="plan-next-day-btn" title="Next Day (Swipe or Click)" aria-label="Next Day">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            ${!isCurrentDateToday ? `<button class="btn btn-sm btn-secondary" id="plan-jump-today">Back to Today</button>` : ''}
          </div>
        </header>

        <!-- 2 Column Layout: Morning/MITs on Left, Timeline/Evening on Right -->
        <div class="plan-grid">
          <!-- Left Column -->
          <div class="plan-column">
            <!-- 1. The Rule of 3 (MITs) Card -->
            <div class="card plan-card mit-card">
              <div class="card-header">
                <div class="card-title-group">
                  <span class="card-eyebrow">High Impact</span>
                  <h2 class="card-title">The Rule of 3 (Most Important Tasks)</h2>
                </div>
                <button class="btn btn-sm btn-secondary" id="manage-mits-btn">Edit 3 Goals</button>
              </div>

              <p class="card-description">If you only achieve three meaningful things before the day ends, what must they be?</p>

              <div class="mits-checklist">
                ${this.renderMITsList(plan.topThree, dayTasks)}
              </div>
            </div>

            <!-- 3. Unfinished Tasks Review Card -->
            <div class="card plan-card rollover-card">
              <div class="card-header">
                <div class="card-title-group">
                  <span class="card-eyebrow">End-of-Day Review</span>
                  <h2 class="card-title">Unfinished Tasks (${unfinishedTasks.length})</h2>
                </div>
                ${unfinishedTasks.length > 0 ? `
                  <button class="btn btn-sm btn-secondary" id="rollover-tasks-btn">
                    Reschedule to Tomorrow →
                  </button>
                ` : ''}
              </div>

              ${unfinishedTasks.length === 0 ? `
                <p class="empty-hint">All tasks for this day are completed or none were assigned. Fantastic!</p>
              ` : `
                <div class="unfinished-tasks-list">
                  ${unfinishedTasks.map(t => `
                    <div class="unfinished-task-item">
                      <button class="task-checkbox-btn" data-action="toggle-task" data-id="${t.id}" aria-label="Mark task done"></button>
                      <span class="ut-title">${escapeHtml(t.title)}</span>
                      <span class="priority-tag priority-${t.priority}">${capitalize(t.priority)}</span>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>

          <!-- Right Column -->
          <div class="plan-column">
            <!-- 4. Schedule & Time Blocks Card with Drawing Timeline and Now Marker -->
            <div class="card plan-card">
              <div class="card-header">
                <div class="card-title-group">
                  <span class="card-eyebrow">Time Management</span>
                  <h2 class="card-title">Daily Time Blocks</h2>
                </div>
                <button class="btn btn-sm btn-secondary" id="add-time-block-btn">+ Add Block</button>
              </div>

              <div class="timeline-wrapper">
                <div class="timeline-spine-line" title="Timeline"></div>
                <div class="time-blocks-container">
                  ${this.renderTimeBlocksList(plan.timeBlocks, isCurrentDateToday)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  renderMITsList(topThree, dayTasks) {
    if (!topThree || topThree.length === 0) {
      return `
        <div class="empty-hint-card">
          <p>No primary goals picked for this day yet.</p>
          <button class="btn btn-sm btn-secondary" id="mit-prompt-btn">Define 3 Core Priorities</button>
        </div>
      `;
    }

    const circleRadius = 9;
    const circleCircumference = 2 * Math.PI * circleRadius; // ~56.55

    return topThree.map((mit, idx) => {
      const isDone = Boolean(mit.completed);
      const sweepOffset = isDone ? 0 : circleCircumference;

      return `
        <div class="plan-mit-row ${isDone ? 'completed' : ''}">
          <span class="mit-rank">#${idx + 1}</span>
          <button class="task-checkbox-btn mit-checkbox-sweep ${isDone ? 'checked' : ''}" 
                  data-action="toggle-plan-mit" 
                  data-idx="${idx}" 
                  aria-label="Toggle MIT ${idx + 1}"
                  style="border: none; background: transparent; padding: 0; display: inline-flex; align-items: center; justify-content: center;">
            <svg class="mit-sweep-svg" width="24" height="24" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="${circleRadius}" fill="none" stroke="var(--border)" stroke-width="2.2" />
              <circle cx="12" cy="12" r="${circleRadius}" fill="none" stroke="var(--accent)" stroke-width="2.5" 
                      stroke-dasharray="${circleCircumference.toFixed(1)}" stroke-dashoffset="${sweepOffset.toFixed(1)}" 
                      stroke-linecap="round" transform="rotate(-90 12 12)" class="mit-sweep-circle" />
              ${isDone ? `<polyline points="16 9 11 14 8 11" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
            </svg>
          </button>
          <span class="mit-label">${escapeHtml(mit.text)}</span>
        </div>
      `;
    }).join('');
  }

  renderTimeBlocksList(blocks, isToday) {
    if (!blocks || blocks.length === 0) {
      return `
        <div class="empty-hint-card">
          <p>No time blocks scheduled. Block out deep focus, meetings, or rest to organize your hours.</p>
          <button class="btn btn-sm btn-secondary" id="prompt-add-block-btn">+ Add First Time Block</button>
        </div>
      `;
    }

    // Sort by startTime
    const sorted = [...blocks].sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Calculate now marker position if viewing today
    let nowMarkerHtml = '';
    if (isToday) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const startDayMinutes = 8 * 60; // 8:00 AM
      const endDayMinutes = 20 * 60;  // 8:00 PM
      const totalSpan = endDayMinutes - startDayMinutes;
      const clamped = Math.max(0, Math.min(1, (currentMinutes - startDayMinutes) / totalSpan));
      const topPct = (clamped * 100).toFixed(1);
      const currentTimeLabel = formatTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);

      nowMarkerHtml = `
        <div class="timeline-now-marker" style="top: ${topPct}%;" title="Current Time: ${currentTimeLabel}">
          <span class="now-dot"></span>
          <span class="now-line"></span>
          <span class="now-label">NOW ${currentTimeLabel}</span>
        </div>
      `;
    }

    const blocksHtml = sorted.map((b, idx) => `
      <div class="time-block-row" data-block-id="${b.id}" style="margin-left: 28px;">
        <div class="tb-time-range">${formatTime(b.startTime)} – ${formatTime(b.endTime)}</div>
        <div class="tb-info">
          <span class="tb-title">${escapeHtml(b.title)}</span>
          <span class="category-pill-label" style="font-size: 11px;">${capitalize(b.category || 'Focus')}</span>
        </div>
        <button class="icon-btn tb-delete-btn" data-action="delete-block" data-id="${b.id}" title="Remove time block">
          &times;
        </button>
      </div>
    `).join('');

    return `
      ${nowMarkerHtml}
      ${blocksHtml}
    `;
  }

  bindEvents() {
    // Prev / Next day navigation with notebook page turning animation
    this.container.querySelector('#plan-prev-day-btn')?.addEventListener('click', () => {
      this.currentDateStr = formatISODate(addDays(this.currentDateStr, -1));
      this.transitionClass = 'notebook-turn-right';
      this.render();
    });

    this.container.querySelector('#plan-next-day-btn')?.addEventListener('click', () => {
      this.currentDateStr = formatISODate(addDays(this.currentDateStr, 1));
      this.transitionClass = 'notebook-turn-left';
      this.render();
    });

    this.container.querySelector('#plan-jump-today')?.addEventListener('click', () => {
      this.currentDateStr = getTodayString();
      this.transitionClass = 'notebook-turn-left';
      this.render();
    });

    // Mobile touch swipe between days (swipe right -> prev, swipe left -> next)
    let touchStartX = 0;
    let touchStartY = 0;
    const planViewEl = this.container.querySelector('.plan-view');
    planViewEl?.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    planViewEl?.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;
      if (Math.abs(diffX) > 48 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
        if (diffX > 0) {
          // Swiped right -> previous day
          this.currentDateStr = formatISODate(addDays(this.currentDateStr, -1));
          this.transitionClass = 'notebook-turn-right';
          this.render();
        } else {
          // Swiped left -> next day
          this.currentDateStr = formatISODate(addDays(this.currentDateStr, 1));
          this.transitionClass = 'notebook-turn-left';
          this.render();
        }
      }
    }, { passive: true });

    // Toggle MIT with circular sweep and confetti burst when all 3 completed
    this.container.querySelectorAll('[data-action="toggle-plan-mit"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const plan = store.getDailyPlan(this.currentDateStr);
        if (plan && plan.topThree && plan.topThree[idx]) {
          plan.topThree[idx].completed = !plan.topThree[idx].completed;
          if (plan.topThree[idx].taskId) {
            store.toggleTask(plan.topThree[idx].taskId);
          }
          store.saveDailyPlan(this.currentDateStr, { topThree: plan.topThree });

          const completedCount = plan.topThree.filter(m => m.completed).length;
          if (plan.topThree[idx].completed) {
            if (completedCount === 3) {
              firePaperConfetti(e.clientX || window.innerWidth / 2, e.clientY || window.innerHeight / 3, 35);
              toast.success('All 3 core priorities achieved! Celebration burst! 🎉');
            } else {
              toast.success(`Priority #${idx + 1} completed! (${completedCount}/3 done)`);
            }
          }
          this.render();
        }
      });
    });

    // Unfinished task checkbox toggle
    this.container.querySelectorAll('[data-action="toggle-task"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        store.toggleTask(id);
        this.render();
      });
    });

    // Rollover tasks to tomorrow
    this.container.querySelector('#rollover-tasks-btn')?.addEventListener('click', async () => {
      const tomorrowStr = formatISODate(addDays(this.currentDateStr, 1));
      const confirmed = await modal.confirm({
        title: 'Reschedule Remaining Tasks',
        message: `Move all unfinished tasks from this date to tomorrow (${tomorrowStr})?`,
        confirmText: 'Reschedule',
        isDestructive: false
      });
      if (confirmed) {
        const count = store.rescheduleUnfinishedTasks(this.currentDateStr, tomorrowStr);
        toast.success(`Rescheduled ${count} unfinished tasks to tomorrow`);
        this.render();
      }
    });

    // Manage MITs modal
    this.container.querySelector('#manage-mits-btn')?.addEventListener('click', () => this.openMITModal());
    this.container.querySelector('#mit-prompt-btn')?.addEventListener('click', () => this.openMITModal());

    // Add time block modal
    this.container.querySelector('#add-time-block-btn')?.addEventListener('click', () => this.openTimeBlockModal());
    this.container.querySelector('#prompt-add-block-btn')?.addEventListener('click', () => this.openTimeBlockModal());

    // Delete time block
    this.container.querySelectorAll('[data-action="delete-block"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const plan = store.getDailyPlan(this.currentDateStr);
        if (plan && plan.timeBlocks) {
          plan.timeBlocks = plan.timeBlocks.filter(b => b.id !== id);
          store.saveDailyPlan(this.currentDateStr, { timeBlocks: plan.timeBlocks });
          toast.info('Time block removed');
          this.render();
        }
      });
    });

    attach3DTilt(this.container.querySelectorAll('.plan-card, .plan-mit-row, .time-block-row'));
    attachButtonRipples(this.container);
  }

  openMITModal() {
    const plan = store.getDailyPlan(this.currentDateStr);
    const dayTasks = store.getTasksForDate(this.currentDateStr);
    const existing = plan.topThree || [];

    const m1 = existing[0] ? existing[0].text : '';
    const m2 = existing[1] ? existing[1].text : '';
    const m3 = existing[2] ? existing[2].text : '';

    const content = `
      <div class="mit-modal-form">
        <p class="modal-sub">Choose three critical outcomes that will make today a success. You can type freely or pick from existing tasks.</p>

        <div class="form-group">
          <label class="form-label">Priority 01</label>
          <input type="text" id="mit-input-1" class="form-input" value="${escapeHtml(m1)}" placeholder="First most important task..." />
        </div>

        <div class="form-group">
          <label class="form-label">Priority 02</label>
          <input type="text" id="mit-input-2" class="form-input" value="${escapeHtml(m2)}" placeholder="Second most important task..." />
        </div>

        <div class="form-group">
          <label class="form-label">Priority 03</label>
          <input type="text" id="mit-input-3" class="form-input" value="${escapeHtml(m3)}" placeholder="Third most important task..." />
        </div>

        ${dayTasks.length > 0 ? `
          <div class="existing-tasks-picker">
            <span class="picker-label">Click to insert from today's tasks:</span>
            <div class="task-chips-pool">
              ${dayTasks.map(t => `<button type="button" class="chip-task-btn" data-title="${escapeHtml(t.title)}" data-task-id="${t.id}">${escapeHtml(t.title)}</button>`).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    const footer = `
      <button class="btn btn-secondary modal-cancel-btn">Cancel</button>
      <button class="btn btn-primary modal-save-mit-btn">Save Priorities</button>
    `;

    const overlay = modal.open('Set The Rule of 3 (MITs)', content, {
      maxWidth: '480px',
      footerHtml: footer,
      onMount: (el) => {
        el.querySelector('.modal-cancel-btn').onclick = () => modal.close();

        // Task chip clicks
        el.querySelectorAll('.chip-task-btn').forEach(btn => {
          btn.onclick = () => {
            const title = btn.getAttribute('data-title');
            const inp1 = el.querySelector('#mit-input-1');
            const inp2 = el.querySelector('#mit-input-2');
            const inp3 = el.querySelector('#mit-input-3');

            if (!inp1.value.trim()) inp1.value = title;
            else if (!inp2.value.trim()) inp2.value = title;
            else if (!inp3.value.trim()) inp3.value = title;
            else inp1.value = title;
          };
        });

        el.querySelector('.modal-save-mit-btn').onclick = () => {
          const v1 = el.querySelector('#mit-input-1').value.trim();
          const v2 = el.querySelector('#mit-input-2').value.trim();
          const v3 = el.querySelector('#mit-input-3').value.trim();

          const newTopThree = [];
          if (v1) newTopThree.push({ id: 'mit-1', text: v1, completed: existing[0] && existing[0].text === v1 ? existing[0].completed : false });
          if (v2) newTopThree.push({ id: 'mit-2', text: v2, completed: existing[1] && existing[1].text === v2 ? existing[1].completed : false });
          if (v3) newTopThree.push({ id: 'mit-3', text: v3, completed: existing[2] && existing[2].text === v3 ? existing[2].completed : false });

          store.saveDailyPlan(this.currentDateStr, { topThree: newTopThree });
          modal.close();
          toast.success('Rule of 3 updated');
          this.render();
        };
      }
    });
  }

  openTimeBlockModal() {
    const categories = store.getCategories();

    const content = `
      <div class="time-block-modal-form">
        <div class="form-group">
          <label class="form-label">Activity / Block Title</label>
          <input type="text" id="tb-title-input" class="form-input" placeholder="e.g. Deep Work: Writing, Team Sync, Lunch Walk" maxlength="80" />
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">Start Time</label>
            <input type="time" id="tb-start-input" class="form-input" value="09:00" />
          </div>
          <div class="form-group">
            <label class="form-label">End Time</label>
            <input type="time" id="tb-end-input" class="form-input" value="10:30" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Category</label>
          <select id="tb-category-select" class="form-select">
            ${categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}
          </select>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-secondary modal-cancel-btn">Cancel</button>
      <button class="btn btn-primary modal-save-block-btn">Add Block</button>
    `;

    modal.open('Schedule Time Block', content, {
      maxWidth: '440px',
      footerHtml: footer,
      onMount: (el) => {
        el.querySelector('.modal-cancel-btn').onclick = () => modal.close();

        el.querySelector('.modal-save-block-btn').onclick = () => {
          const title = el.querySelector('#tb-title-input').value.trim();
          const startTime = el.querySelector('#tb-start-input').value;
          const endTime = el.querySelector('#tb-end-input').value;
          const category = el.querySelector('#tb-category-select').value;

          if (!title) {
            toast.warning('Please enter a title for the time block');
            return;
          }

          const plan = store.getDailyPlan(this.currentDateStr);
          const blocks = plan.timeBlocks || [];
          blocks.push({
            id: 'tb_' + Date.now(),
            title,
            startTime,
            endTime,
            category
          });

          store.saveDailyPlan(this.currentDateStr, { timeBlocks: blocks });
          modal.close();
          toast.success('Time block added');
          this.render();
        };
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

function capitalize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

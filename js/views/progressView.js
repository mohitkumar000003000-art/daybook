/**
 * Progress & Insights View for Daybook
 * Real calculated metrics, streaks, productivity trends, SVG charts,
 * category distributions, and historical achievement logs.
 */
import { store } from '../store.js';
import { 
  renderWeeklyTaskChart, 
  renderWritingActivityTrend, 
  renderCategoryBreakdown 
} from '../components/charts.js';
import { 
  addDays, 
  formatISODate, 
  formatDisplayDate, 
  formatShortDate 
} from '../utils/dateUtils.js';
import { attach3DTilt, animateNumberCounter, attachButtonRipples } from '../utils/interactiveFX.js';

export class ProgressView {
  constructor({ container, onOpenJournalEditor }) {
    this.container = container;
    this.onOpenJournalEditor = onOpenJournalEditor;
  }

  render() {
    const allTasks = store.getTasks();
    const allEntries = store.getJournalEntries();
    const writingStats = store.getWritingStats();
    const categories = store.getCategories();

    // 1. Task Completion Stats
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.completed).length;
    const lifetimePct = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    // 2. Prepare 7-Day Task Completion Data for SVG Chart
    const today = new Date();
    const last7DaysData = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDays(today, -i);
      const dStr = formatISODate(d);
      const dayTasks = store.getTasksForDate(dStr);
      const dayDone = dayTasks.filter(t => t.completed).length;
      last7DaysData.push({
        dateStr: dStr,
        dateLabel: i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        total: dayTasks.length,
        completed: dayDone
      });
    }

    // 3. Prepare 14-Day Writing Trend Data for SVG Chart
    const last14DaysData = [];
    for (let i = 13; i >= 0; i--) {
      const d = addDays(today, -i);
      const dStr = formatISODate(d);
      const dayEntries = store.getJournalEntriesForDate(dStr);
      const wordCount = dayEntries.reduce((sum, e) => sum + (e.wordCount || 0), 0);
      last14DaysData.push({
        dateStr: dStr,
        dateLabel: formatShortDate(d),
        wordCount,
        hasEntry: dayEntries.length > 0
      });
    }

    // 4. Category breakdown counts
    const catMap = new Map();
    categories.forEach(c => catMap.set(c.id, { name: c.name, color: c.color, count: 0 }));
    allTasks.forEach(t => {
      const c = catMap.get(t.category);
      if (c) c.count++;
      else {
        catMap.set(t.category, { name: t.category, color: '#455A64', count: 1 });
      }
    });
    const categoriesWithCounts = Array.from(catMap.values());

    // 5. Recent Completed Milestones (last 10 completed tasks)
    const recentlyCompleted = allTasks
      .filter(t => t.completed)
      .sort((a, b) => (b.completedAt || b.dueDate).localeCompare(a.completedAt || a.dueDate))
      .slice(0, 8);

    this.container.innerHTML = `
      <div class="view-content progress-view">
        <!-- View Header -->
        <header class="view-header">
          <div class="view-header-title">
            <span class="card-eyebrow">Analytics & Reflection</span>
            <h1 class="page-title">Progress & Insights</h1>
            <p class="page-subtext">Quantify your consistency, celebrate completed milestones, and observe the patterns of your days.</p>
          </div>
        </header>

        <!-- KPI Metric Cards Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-meta">
              <span class="stat-label">Current Writing Streak</span>
              <span class="stat-sub">Consecutive days</span>
            </div>
            <div class="stat-value"><span id="prog-stat-streak">${writingStats.currentStreak}</span> <span class="stat-unit">days</span></div>
            <span class="stat-note">Longest recorded streak: ${writingStats.longestStreak} days</span>
          </div>

          <div class="stat-card">
            <div class="stat-meta">
              <span class="stat-label">Lifetime Completion</span>
              <span class="stat-sub">${completedTasks} of ${totalTasks} tasks</span>
            </div>
            <div class="stat-value" id="prog-stat-pct">${lifetimePct}%</div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill" style="width: ${lifetimePct}%"></div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-meta">
              <span class="stat-label">Total Volume Written</span>
              <span class="stat-sub">${allEntries.length} reflections</span>
            </div>
            <div class="stat-value"><span id="prog-stat-words">${writingStats.totalWords.toLocaleString()}</span> <span class="stat-unit">words</span></div>
            <span class="stat-note">Average ~${allEntries.length > 0 ? Math.round(writingStats.totalWords / allEntries.length) : 0} words per entry</span>
          </div>

          <div class="stat-card">
            <div class="stat-meta">
              <span class="stat-label">Active Reflective Days</span>
              <span class="stat-sub">Historical entries</span>
            </div>
            <div class="stat-value"><span id="prog-stat-days">${writingStats.activeDaysCount}</span> <span class="stat-unit">days</span></div>
            <span class="stat-note">Mindfulness practice established</span>
          </div>
        </div>

        <!-- Charts Grid -->
        <div class="progress-charts-grid">
          <!-- 1. Weekly Task Completion Bar Chart -->
          <div class="card chart-card">
            <div class="card-header">
              <div class="card-title-group">
                <span class="card-eyebrow">7-Day Trajectory</span>
                <h2 class="card-title">Daily Task Execution</h2>
              </div>
            </div>
            <div class="chart-embed">
              ${renderWeeklyTaskChart(last7DaysData)}
            </div>
          </div>

          <!-- 2. Writing Activity Curve -->
          <div class="card chart-card">
            <div class="card-header">
              <div class="card-title-group">
                <span class="card-eyebrow">14-Day Timeline</span>
                <h2 class="card-title">Writing Consistency & Word Count</h2>
              </div>
            </div>
            <div class="chart-embed">
              ${renderWritingActivityTrend(last14DaysData)}
            </div>
          </div>
        </div>

        <!-- 2 Column Lower Section: Category Distribution & Completed Milestones History -->
        <div class="progress-lower-grid">
          <!-- Category Breakdown -->
          <div class="card">
            <div class="card-header">
              <div class="card-title-group">
                <span class="card-eyebrow">Life Domains</span>
                <h2 class="card-title">Tasks by Category</h2>
              </div>
            </div>

            <div class="category-breakdown-wrapper">
              ${renderCategoryBreakdown(categoriesWithCounts)}
            </div>
          </div>

          <!-- Recently Completed Achievements Archive -->
          <div class="card">
            <div class="card-header">
              <div class="card-title-group">
                <span class="card-eyebrow">Accomplishment Log</span>
                <h2 class="card-title">Recently Completed Tasks</h2>
              </div>
            </div>

            <div class="history-log-list">
              ${recentlyCompleted.length === 0 ? `<p class="empty-hint">No completed tasks yet. Finish a task today to start your accomplishment log!</p>` : `
                ${recentlyCompleted.map(t => {
                  const dateStr = t.completedAt ? formatDisplayDate(t.completedAt.split('T')[0], { month: 'short', day: 'numeric' }) : formatDisplayDate(t.dueDate, { month: 'short', day: 'numeric' });
                  return `
                    <div class="history-item">
                      <div class="history-check-icon">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <div class="history-info">
                        <span class="history-title">${escapeHtml(t.title)}</span>
                        <div class="history-meta">
                          <span class="history-date">${dateStr}</span>
                          <span class="category-tag category-${t.category}">${capitalize(t.category)}</span>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              `}
            </div>
          </div>
        </div>
      </div>
    `;

    // Trigger number count-up animations
    animateNumberCounter(this.container.querySelector('#prog-stat-streak'), writingStats.currentStreak, 650);
    animateNumberCounter(this.container.querySelector('#prog-stat-pct'), lifetimePct, 800, '', '%');
    animateNumberCounter(this.container.querySelector('#prog-stat-words'), writingStats.totalWords, 900);
    animateNumberCounter(this.container.querySelector('#prog-stat-days'), writingStats.activeDaysCount, 600);

    // Attach 3D tilt and click ripples
    attach3DTilt(this.container.querySelectorAll('.stat-card, .chart-card, .history-item'));
    attachButtonRipples(this.container);
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

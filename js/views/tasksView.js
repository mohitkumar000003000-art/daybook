/**
 * Tasks View for Daybook
 * Full-featured daily to-do list with categories, priorities, due dates/times,
 * drag & drop reordering, filtering, sorting, and modal management.
 */
import { store } from '../store.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { getTodayString, isToday, isPastDay, isFutureDay, formatDisplayDate, formatTime } from '../utils/dateUtils.js';
import { firePaperConfetti } from '../utils/confetti.js';
import { attachButtonRipples, attach3DTilt } from '../utils/interactiveFX.js';

export class TasksView {
  constructor({ container, onOpenTaskModal }) {
    this.container = container;
    this.onOpenTaskModal = onOpenTaskModal;

    this.activeTab = 'today'; // 'today', 'upcoming', 'overdue', 'completed', 'all'
    this.selectedCategory = 'all';
    this.selectedPriority = 'all';
    this.searchQuery = '';
    this.sortBy = 'order'; // 'order', 'dueDate', 'priority', 'title'
    this.draggedTaskId = null;
  }

  render() {
    const todayStr = getTodayString();
    const categories = store.getCategories();
    const allTasks = store.getTasks();

    // Counts for tabs
    const todayCount = allTasks.filter(t => t.dueDate === todayStr && !t.completed).length;
    const upcomingCount = allTasks.filter(t => isFutureDay(t.dueDate) && !t.completed).length;
    const overdueCount = allTasks.filter(t => isPastDay(t.dueDate) && !t.completed).length;
    const completedCount = allTasks.filter(t => t.completed).length;

    // Filter tasks for current view
    const filteredTasks = this.getFilteredTasks(allTasks);

    // Progress stats for currently displayed scope
    const totalCount = filteredTasks.length;
    const doneCount = filteredTasks.filter(t => t.completed).length;
    const pct = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

    this.container.innerHTML = `
      <div class="view-content tasks-view">
        <!-- View Header -->
        <header class="view-header">
          <div class="view-header-title">
            <span class="card-eyebrow">Task Management</span>
            <h1 class="page-title">My Tasks & Schedule</h1>
            <p class="page-subtext">Organize priorities, eliminate clutter, and track steady completion.</p>
          </div>
          <div class="view-header-actions">
            <button class="btn btn-secondary" id="manage-categories-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><circle cx="4" cy="14" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="20" cy="16" r="2"/></svg>
              Categories
            </button>
            <button class="btn btn-primary" id="add-task-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Task
            </button>
          </div>
        </header>

        <!-- Inline Quick Add Input -->
        <div class="quick-add-task-bar">
          <div class="quick-add-input-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <input type="text" id="quick-task-input" placeholder="Type a task and press Enter to quickly add to Today..." maxlength="120" />
          </div>
          <button class="btn btn-sm btn-secondary" id="quick-task-submit">Add</button>
        </div>

        <!-- Navigation Tabs Bar -->
        <div class="tasks-tabs-row">
          <div class="tab-pills" role="tablist">
            <button class="tab-btn ${this.activeTab === 'today' ? 'active' : ''}" data-tab="today" role="tab">
              Today <span class="tab-count">${todayCount}</span>
            </button>
            <button class="tab-btn ${this.activeTab === 'upcoming' ? 'active' : ''}" data-tab="upcoming" role="tab">
              Upcoming <span class="tab-count">${upcomingCount}</span>
            </button>
            <button class="tab-btn ${this.activeTab === 'overdue' ? 'active' : ''}" data-tab="overdue" role="tab">
              Overdue ${overdueCount > 0 ? `<span class="tab-count alert">${overdueCount}</span>` : `<span class="tab-count">0</span>`}
            </button>
            <button class="tab-btn ${this.activeTab === 'completed' ? 'active' : ''}" data-tab="completed" role="tab">
              Completed <span class="tab-count">${completedCount}</span>
            </button>
            <button class="tab-btn ${this.activeTab === 'all' ? 'active' : ''}" data-tab="all" role="tab">
              All Tasks <span class="tab-count">${allTasks.length}</span>
            </button>
          </div>

          <!-- Progress Widget -->
          <div class="tab-progress-summary">
            <span class="progress-label">${doneCount} of ${totalCount} completed (${pct}%)</span>
            <div class="progress-bar-track tab-progress-bar">
              <div class="progress-bar-fill" style="width: ${pct}%"></div>
            </div>
          </div>
        </div>

        <!-- Filters & Search Toolbar -->
        <div class="tasks-filter-toolbar">
          <div class="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="task-search-input" placeholder="Search tasks..." value="${escapeHtml(this.searchQuery)}" />
            ${this.searchQuery ? `<button class="clear-search-btn" id="clear-search">&times;</button>` : ''}
          </div>

          <!-- Category filter pills -->
          <div class="category-filter-scroll">
            <button class="filter-pill ${this.selectedCategory === 'all' ? 'active' : ''}" data-category="all">All</button>
            ${categories.map(c => `
              <button class="filter-pill ${this.selectedCategory === c.id ? 'active' : ''}" data-category="${c.id}">
                <span class="category-color-pip" style="background: ${c.color}"></span>
                ${escapeHtml(c.name)}
              </button>
            `).join('')}
          </div>

          <!-- Sort dropdown & Priority filter -->
          <div class="filter-dropdowns">
            <select class="form-select select-sm" id="priority-filter-select" aria-label="Filter by priority">
              <option value="all" ${this.selectedPriority === 'all' ? 'selected' : ''}>All Priorities</option>
              <option value="high" ${this.selectedPriority === 'high' ? 'selected' : ''}>High Priority</option>
              <option value="medium" ${this.selectedPriority === 'medium' ? 'selected' : ''}>Medium Priority</option>
              <option value="low" ${this.selectedPriority === 'low' ? 'selected' : ''}>Low Priority</option>
            </select>

            <select class="form-select select-sm" id="sort-select" aria-label="Sort tasks">
              <option value="order" ${this.sortBy === 'order' ? 'selected' : ''}>Custom Order</option>
              <option value="dueDate" ${this.sortBy === 'dueDate' ? 'selected' : ''}>Due Date</option>
              <option value="priority" ${this.sortBy === 'priority' ? 'selected' : ''}>Priority</option>
              <option value="title" ${this.sortBy === 'title' ? 'selected' : ''}>Alphabetical</option>
            </select>
          </div>
        </div>

        <!-- Task List Container -->
        <div class="tasks-container card">
          ${filteredTasks.length === 0 ? this.renderEmptyState() : `
            <div class="task-items-list" id="task-items-list">
              ${filteredTasks.map((task, idx) => this.renderTaskItem(task, idx)).join('')}
            </div>
          `}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  getFilteredTasks(tasks) {
    const todayStr = getTodayString();
    let result = [...tasks];

    // Filter by Tab
    if (this.activeTab === 'today') {
      result = result.filter(t => t.dueDate === todayStr);
    } else if (this.activeTab === 'upcoming') {
      result = result.filter(t => isFutureDay(t.dueDate) && !t.completed);
    } else if (this.activeTab === 'overdue') {
      result = result.filter(t => isPastDay(t.dueDate) && !t.completed);
    } else if (this.activeTab === 'completed') {
      result = result.filter(t => t.completed);
    }

    // Filter by Category
    if (this.selectedCategory !== 'all') {
      result = result.filter(t => t.category === this.selectedCategory);
    }

    // Filter by Priority
    if (this.selectedPriority !== 'all') {
      result = result.filter(t => t.priority === this.selectedPriority);
    }

    // Filter by Search Query
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) || 
        (t.notes && t.notes.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (this.sortBy === 'dueDate') {
      result.sort((a, b) => (a.dueDate + (a.dueTime || '')).localeCompare(b.dueDate + (b.dueTime || '')));
    } else if (this.sortBy === 'priority') {
      const pWeights = { high: 1, medium: 2, low: 3 };
      result.sort((a, b) => pWeights[a.priority] - pWeights[b.priority]);
    } else if (this.sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // order
      result.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    return result;
  }

  renderTaskItem(task, index) {
    const todayStr = getTodayString();
    const isDueToday = task.dueDate === todayStr;
    const isOverdue = isPastDay(task.dueDate) && !task.completed;
    const isFuture = isFutureDay(task.dueDate);

    let dateBadgeText = '';
    let dateBadgeClass = '';
    if (isDueToday) {
      dateBadgeText = 'Today';
      dateBadgeClass = 'badge-today';
    } else if (isOverdue) {
      dateBadgeText = `Overdue (${formatDisplayDate(task.dueDate, { month: 'short', day: 'numeric' })})`;
      dateBadgeClass = 'badge-overdue';
    } else if (isFuture) {
      dateBadgeText = formatDisplayDate(task.dueDate, { month: 'short', day: 'numeric' });
      dateBadgeClass = 'badge-future';
    } else {
      dateBadgeText = formatDisplayDate(task.dueDate, { month: 'short', day: 'numeric' });
      dateBadgeClass = 'badge-past';
    }

    const timeStr = task.dueTime ? formatTime(task.dueTime) : '';
    const categories = store.getCategories();
    const cat = categories.find(c => c.id === task.category) || { name: task.category, color: '#455A64' };

    const isDropped = this.lastAddedTaskId && this.lastAddedTaskId === task.id;

    return `
      <div class="task-row full-task-row ${task.completed ? 'completed' : ''} ${isDropped ? 'task-drop-in' : ''}" 
           data-task-id="${task.id}" 
           draggable="${this.sortBy === 'order'}" 
           tabindex="0">
        
        <!-- Drag Handle -->
        ${this.sortBy === 'order' ? `
          <div class="drag-handle" title="Drag to reorder" aria-label="Drag to reorder">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
          </div>
        ` : ''}

        <!-- Checkbox -->
        <button class="task-checkbox-btn ${task.completed ? 'checked' : ''}" 
                data-action="toggle-task" 
                data-id="${task.id}" 
                aria-label="${task.completed ? 'Mark task as incomplete' : 'Mark task as complete'}">
          ${task.completed ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
        </button>

        <!-- Main Task Info -->
        <div class="task-main-content">
          <div class="task-title-line">
            <span class="task-title">${escapeHtml(task.title)}</span>
          </div>
          ${task.notes ? `<p class="task-notes-snippet">${escapeHtml(task.notes)}</p>` : ''}
          <div class="task-meta-tags">
            <span class="priority-tag priority-${task.priority}">${capitalize(task.priority)}</span>
            <span class="category-tag" style="background: ${cat.color}15; color: ${cat.color}; border: 1px solid ${cat.color}35;">
              <span class="category-color-pip" style="background: ${cat.color}"></span>
              ${escapeHtml(cat.name)}
            </span>
            <span class="date-badge ${dateBadgeClass}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${dateBadgeText}
            </span>
            ${timeStr ? `
              <span class="time-tag">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                ${timeStr}
              </span>
            ` : ''}
          </div>
        </div>

        <!-- Row Actions (Edit, Delete) -->
        <div class="task-row-actions">
          <button class="icon-btn edit-task-btn" data-action="edit-task" data-id="${task.id}" title="Edit task" aria-label="Edit task">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="icon-btn delete-task-btn" data-action="delete-task" data-id="${task.id}" title="Delete task" aria-label="Delete task">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
      </div>
    `;
  }

  renderEmptyState() {
    const isAll = this.activeTab === 'all' || this.activeTab === 'today';
    const totalTasks = store.getTasks().length;

    let title = 'Clean Slate';
    let msg = 'No tasks in this view.';
    let btnText = '+ Create New Task';

    if (totalTasks === 0) {
      title = 'Your Daybook is Empty';
      msg = 'Create your first task to start organizing your daily priorities and routines.';
      btnText = '+ Create Your First Task';
    } else if (this.activeTab === 'today') {
      msg = 'All clear for today! Take time to reflect or plan what comes next.';
    } else if (this.activeTab === 'overdue') {
      msg = 'No overdue tasks! You are right on schedule.';
    } else if (this.activeTab === 'upcoming') {
      msg = 'No upcoming tasks scheduled yet.';
    } else if (this.activeTab === 'completed') {
      msg = 'No completed tasks recorded yet.';
    }

    return `
      <div class="empty-state">
        <div class="empty-icon">✓</div>
        <h3 class="empty-title">${title}</h3>
        <p class="empty-text">${msg}</p>
        <button class="btn btn-primary" id="empty-add-task-btn">${btnText}</button>
      </div>
    `;
  }

  bindEvents() {
    // Tab switching
    this.container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.getAttribute('data-tab');
        this.render();
      });
    });

    // Category filtering
    this.container.querySelectorAll('.filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedCategory = btn.getAttribute('data-category');
        this.render();
      });
    });

    // Priority filter dropdown
    this.container.querySelector('#priority-filter-select')?.addEventListener('change', (e) => {
      this.selectedPriority = e.target.value;
      this.render();
    });

    // Sort select
    this.container.querySelector('#sort-select')?.addEventListener('change', (e) => {
      this.sortBy = e.target.value;
      this.render();
    });

    // Search input
    const searchInput = this.container.querySelector('#task-search-input');
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      // Re-filter without losing focus
      const filtered = this.getFilteredTasks(store.getTasks());
      const listEl = this.container.querySelector('#task-items-list');
      if (listEl) {
        if (filtered.length === 0) {
          listEl.innerHTML = `<div class="empty-hint-card"><p>No tasks match "${escapeHtml(this.searchQuery)}"</p></div>`;
        } else {
          listEl.innerHTML = filtered.map((t, idx) => this.renderTaskItem(t, idx)).join('');
          this.bindRowActions();
        }
      }
    });

    this.container.querySelector('#clear-search')?.addEventListener('click', () => {
      this.searchQuery = '';
      this.render();
    });

    // Add task button
    this.container.querySelector('#add-task-btn')?.addEventListener('click', () => this.onOpenTaskModal());
    this.container.querySelector('#empty-add-task-btn')?.addEventListener('click', () => this.onOpenTaskModal());

    // Quick add task input
    const quickInput = this.container.querySelector('#quick-task-input');
    const submitQuickAdd = () => {
      const val = quickInput.value.trim();
      if (!val) return;
      const newTask = store.addTask({
        title: val,
        dueDate: getTodayString(),
        priority: 'medium',
        category: this.selectedCategory !== 'all' ? this.selectedCategory : 'personal'
      });
      this.lastAddedTaskId = newTask?.id;
      quickInput.value = '';
      toast.success('Task added to Today');
      this.render();
    };

    quickInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitQuickAdd();
      }
    });
    this.container.querySelector('#quick-task-submit')?.addEventListener('click', submitQuickAdd);

    // Manage Categories button
    this.container.querySelector('#manage-categories-btn')?.addEventListener('click', () => {
      this.openCategoriesModal();
    });

    this.bindRowActions();
    this.bindDragAndDrop();

    attachButtonRipples(this.container);
    attach3DTilt(this.container.querySelectorAll('.full-task-row'));
  }

  bindRowActions() {
    // Checkbox toggle: pops and fills, strike-through drawn left to right, then row slides away
    this.container.querySelectorAll('[data-action="toggle-task"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const row = btn.closest('.full-task-row') || btn.closest('.task-row');
        const task = store.getTaskById(id);
        const willComplete = task && !task.completed;

        if (willComplete && row) {
          btn.classList.add('checked');
          if (!btn.querySelector('svg')) {
            btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`;
          }
          row.classList.add('completed');
          row.classList.add('just-completed');

          const shouldSlideAway = this.activeTab !== 'all' && this.activeTab !== 'completed';

          if (shouldSlideAway) {
            setTimeout(() => {
              row.classList.add('slide-away');
              setTimeout(() => {
                store.toggleTask(id);
                const stats = store.getTaskStats(store.getTodayString ? store.getTodayString() : new Date().toISOString().split('T')[0]);
                if (stats.total > 0 && stats.remaining === 0) {
                  firePaperConfetti(e.clientX, e.clientY, 30);
                }
                toast.success('Task completed! Keep up the momentum.');
                this.render();
              }, 340);
            }, 260);
            return;
          }
        }

        const updated = store.toggleTask(id);
        if (updated && updated.completed) {
          const stats = store.getTaskStats(store.getTodayString ? store.getTodayString() : new Date().toISOString().split('T')[0]);
          if (stats.total > 0 && stats.remaining === 0) {
            firePaperConfetti(e.clientX, e.clientY, 30);
          }
          toast.success('Task completed! Keep up the momentum.');
        }
        this.render();
      });
    });

    // Priority badges pulse once when clicked or changed
    this.container.querySelectorAll('.priority-tag').forEach(tag => {
      tag.style.cursor = 'pointer';
      tag.title = 'Priority level';
      tag.addEventListener('click', (e) => {
        e.stopPropagation();
        tag.classList.remove('pulse-once');
        void tag.offsetWidth; // Trigger reflow for re-animation
        tag.classList.add('pulse-once');
      });
    });

    // Edit task
    this.container.querySelectorAll('[data-action="edit-task"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        this.onOpenTaskModal(id);
      });
    });

    // Click full task row to open details/edit
    this.container.querySelectorAll('.full-task-row').forEach(row => {
      row.style.cursor = 'pointer';
      row.addEventListener('click', (e) => {
        if (e.target.closest('[data-action="toggle-task"], [data-action="delete-task"], [data-action="edit-task"], .drag-handle, .priority-tag')) {
          return;
        }
        const id = row.getAttribute('data-task-id');
        if (id) {
          this.onOpenTaskModal(id);
        }
      });
    });

    // Delete task: shrinks to nothing and rows below slide up
    this.container.querySelectorAll('[data-action="delete-task"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const task = store.getTaskById(id);
        const confirmed = await modal.confirm({
          title: 'Delete Task',
          message: `Are you sure you want to permanently delete "${task ? task.title : 'this task'}"?`,
          confirmText: 'Delete',
          isDestructive: true
        });
        if (confirmed) {
          const row = btn.closest('.full-task-row') || btn.closest('.task-row');
          if (row) {
            row.classList.add('task-deleting');
            setTimeout(() => {
              store.deleteTask(id);
              toast.info('Task deleted');
              this.render();
            }, 300);
          } else {
            store.deleteTask(id);
            toast.info('Task deleted');
            this.render();
          }
        }
      });
    });
  }

  bindDragAndDrop() {
    if (this.sortBy !== 'order') return;

    const list = this.container.querySelector('#task-items-list');
    if (!list) return;

    const rows = list.querySelectorAll('.full-task-row');
    rows.forEach(row => {
      row.addEventListener('dragstart', (e) => {
        this.draggedTaskId = row.getAttribute('data-task-id');
        row.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      row.addEventListener('dragend', () => {
        row.classList.remove('dragging');
        row.classList.add('settled');
        setTimeout(() => row.classList.remove('settled'), 350);
        this.draggedTaskId = null;
        rows.forEach(r => r.classList.remove('drag-over'));
      });

      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        row.classList.add('drag-over');
      });

      row.addEventListener('dragleave', () => {
        row.classList.remove('drag-over');
      });

      row.addEventListener('drop', (e) => {
        e.preventDefault();
        row.classList.remove('drag-over');
        const targetTaskId = row.getAttribute('data-task-id');
        if (this.draggedTaskId && this.draggedTaskId !== targetTaskId) {
          const allTasks = store.getTasks();
          const taskIds = allTasks.map(t => t.id);
          const fromIndex = taskIds.indexOf(this.draggedTaskId);
          const toIndex = taskIds.indexOf(targetTaskId);

          if (fromIndex !== -1 && toIndex !== -1) {
            taskIds.splice(fromIndex, 1);
            taskIds.splice(toIndex, 0, this.draggedTaskId);
            store.reorderTasks(taskIds);
            toast.info('Tasks reordered');
            this.render();
          }
        }
      });
    });
  }

  openCategoriesModal() {
    const renderCategoryList = () => {
      const cats = store.getCategories();
      return cats.map(c => `
        <div class="category-item-row" data-cat-id="${c.id}">
          <span class="category-color-pip" style="background: ${c.color}"></span>
          <span class="category-name-text">${escapeHtml(c.name)}</span>
          ${!['work', 'personal', 'study', 'health'].includes(c.id) ? `
            <button class="btn btn-sm btn-text remove-cat-btn" data-id="${c.id}" title="Remove category">&times;</button>
          ` : `<span class="category-default-tag">Default</span>`}
        </div>
      `).join('');
    };

    const content = `
      <div class="categories-manager">
        <p class="modal-sub">Create custom categories to organize your journal and tasks by life domain.</p>
        
        <div class="category-list-wrap">
          ${renderCategoryList()}
        </div>

        <hr class="modal-divider" />

        <div class="add-category-form">
          <label class="form-label">Add New Category</label>
          <div class="add-cat-row">
            <input type="text" id="new-cat-name" class="form-input" placeholder="e.g., Finance, Creative, Garden" maxlength="24" />
            <input type="color" id="new-cat-color" class="form-color-picker" value="#9E472A" title="Pick color" />
            <button type="button" class="btn btn-primary" id="new-cat-submit-btn">Add</button>
          </div>
        </div>
      </div>
    `;

    const overlay = modal.open('Manage Task Categories', content, {
      maxWidth: '460px',
      onMount: (el) => {
        const attachRemovers = () => {
          el.querySelectorAll('.remove-cat-btn').forEach(btn => {
            btn.onclick = () => {
              const id = btn.getAttribute('data-id');
              store.deleteCategory(id);
              el.querySelector('.category-list-wrap').innerHTML = renderCategoryList();
              attachRemovers();
              this.render();
            };
          });
        };

        attachRemovers();

        const addBtn = el.querySelector('#new-cat-submit-btn');
        const nameInput = el.querySelector('#new-cat-name');
        const colorInput = el.querySelector('#new-cat-color');

        addBtn.onclick = () => {
          const val = nameInput.value.trim();
          if (!val) return;
          store.addCategory(val, colorInput.value);
          nameInput.value = '';
          el.querySelector('.category-list-wrap').innerHTML = renderCategoryList();
          attachRemovers();
          this.render();
          toast.success(`Category "${val}" added`);
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

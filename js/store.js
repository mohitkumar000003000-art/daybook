/**
 * Daybook Data Store
 * Manages local persistence, state mutations, and change subscriptions.
 */
import { getDemoData } from './utils/demoData.js';
import { getTodayString, formatISODate, calculateStreak } from './utils/dateUtils.js';
import { sanitizeHTML, sanitizeUrl } from './utils/sanitize.js';

const STORAGE_KEY = 'daybook_state_v1';

class Store {
  constructor() {
    this.listeners = new Set();
    this.data = this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // If stored data contains the legacy demo "Alex" seed or legacy tasks, upgrade to clean state
        const isLegacyDemo = parsed && (
          (parsed.user && parsed.user.name === 'Alex' && !parsed.user.googleAccount?.isSignedIn) ||
          (Array.isArray(parsed.tasks) && parsed.tasks.some(t => t.id === 'task-1' || t.id === 'task-2'))
        );
        if (isLegacyDemo) {
          console.info('Upgraded legacy demo dataset to clean Daybook workspace.');
          const cleanState = this.getCleanEmptyState();
          this.saveToStorage(cleanState);
          return cleanState;
        }

        // Ensure standard structure exists
        if (parsed && parsed.tasks && parsed.journalEntries) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to parse stored Daybook data. Initializing clean workspace.', err);
    }
    // New users start with a clean empty workspace: no pre-filled profile, tasks, entries, or demo stats.
    const emptyInitial = this.getCleanEmptyState();
    return emptyInitial;
  }

  getCleanEmptyState() {
    return {
      user: {
        name: '',
        theme: 'light',
        dailyQuote: true,
        hasSeenDemoNotice: true,
        isDemoLoaded: false,
        googleAccount: { isSignedIn: false }
      },
      categories: [
        { id: "work", name: "Work", color: "#455A64" },
        { id: "personal", name: "Personal", color: "#9E472A" },
        { id: "study", name: "Study", color: "#2B5B84" },
        { id: "health", name: "Health", color: "#436A57" },
        { id: "creative", name: "Creative", color: "#8E44AD" }
      ],
      tasks: [],
      journalEntries: [],
      dailyPlans: {},
      quotes: getDemoData().quotes
    };
  }

  hasStoredData() {
    return !!localStorage.getItem(STORAGE_KEY);
  }

  saveToStorage(customData = null) {
    try {
      const dataToSave = customData || this.data;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (err) {
      console.error('Daybook failed to save data to localStorage:', err);
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event, payload) {
    this.saveToStorage();
    for (const listener of this.listeners) {
      try {
        listener(event, payload);
      } catch (e) {
        console.error('Error in store listener:', e);
      }
    }
  }

  // ----------------------------------------------------
  // TASKS
  // ----------------------------------------------------
  getTasks() {
    return [...(this.data.tasks || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  getTaskById(id) {
    return this.data.tasks.find(t => t.id === id) || null;
  }

  getTasksForDate(dateStr) {
    return this.getTasks().filter(t => t.dueDate === dateStr);
  }

  addTask(taskInput) {
    const todayStr = getTodayString();
    const newTask = {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      title: (taskInput.title || '').trim(),
      dueDate: taskInput.dueDate || todayStr,
      dueTime: taskInput.dueTime || '',
      priority: taskInput.priority || 'medium', // high, medium, low
      category: taskInput.category || 'personal',
      notes: (taskInput.notes || '').trim(),
      completed: !!taskInput.completed,
      completedAt: taskInput.completed ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      order: this.data.tasks.length + 1
    };

    this.data.tasks.push(newTask);
    this.notify('task:created', newTask);
    return newTask;
  }

  updateTask(id, updates) {
    const task = this.getTaskById(id);
    if (!task) return null;

    if (updates.completed !== undefined && updates.completed !== task.completed) {
      updates.completedAt = updates.completed ? new Date().toISOString() : null;
    }

    Object.assign(task, updates);
    this.notify('task:updated', task);
    return task;
  }

  toggleTask(id) {
    const task = this.getTaskById(id);
    if (!task) return null;
    return this.updateTask(id, { completed: !task.completed });
  }

  deleteTask(id) {
    const index = this.data.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      const [removed] = this.data.tasks.splice(index, 1);
      
      // Also clean up from any daily plans topThree if linked
      for (const date in this.data.dailyPlans) {
        const plan = this.data.dailyPlans[date];
        if (plan && plan.topThree) {
          plan.topThree = plan.topThree.filter(mit => mit.taskId !== id);
        }
      }

      this.notify('task:deleted', removed);
      return removed;
    }
    return null;
  }

  reorderTasks(orderedIds) {
    const map = new Map(this.data.tasks.map(t => [t.id, t]));
    this.data.tasks = orderedIds.map((id, index) => {
      const task = map.get(id);
      if (task) {
        task.order = index + 1;
        return task;
      }
      return null;
    }).filter(Boolean);

    this.notify('tasks:reordered', this.data.tasks);
  }

  getTaskStats(dateStr = null) {
    const all = dateStr ? this.getTasksForDate(dateStr) : this.data.tasks;
    const total = all.length;
    const completed = all.filter(t => t.completed).length;
    const remaining = total - completed;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    return { total, completed, remaining, percentage };
  }

  rescheduleUnfinishedTasks(fromDateStr, toDateStr) {
    const unfinished = this.data.tasks.filter(t => t.dueDate === fromDateStr && !t.completed);
    let count = 0;
    for (const t of unfinished) {
      t.dueDate = toDateStr;
      count++;
    }
    if (count > 0) {
      this.notify('tasks:rescheduled', { from: fromDateStr, to: toDateStr, count });
    }
    return count;
  }

  // ----------------------------------------------------
  // JOURNAL ENTRIES
  // ----------------------------------------------------
  getJournalEntries(query = '', filterTag = '', filterMood = '') {
    let entries = [...(this.data.journalEntries || [])];
    
    // Sort descending by date & time
    entries.sort((a, b) => {
      const dtA = `${a.date}T${a.time || '00:00'}`;
      const dtB = `${b.date}T${b.time || '00:00'}`;
      return dtB.localeCompare(dtA);
    });

    if (query) {
      const q = query.toLowerCase();
      entries = entries.filter(e => 
        (e.title && e.title.toLowerCase().includes(q)) || 
        (e.content && e.content.toLowerCase().includes(q)) ||
        (e.tags && e.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    if (filterTag) {
      entries = entries.filter(e => e.tags && e.tags.includes(filterTag));
    }

    if (filterMood) {
      entries = entries.filter(e => e.mood === filterMood);
    }

    return entries;
  }

  getJournalEntryById(id) {
    return this.data.journalEntries.find(e => e.id === id) || null;
  }

  getJournalEntriesForDate(dateStr) {
    return this.getJournalEntries().filter(e => e.date === dateStr);
  }

  saveJournalEntry(entryInput) {
    const isNew = !entryInput.id;
    const now = new Date();
    const timeStr = entryInput.time || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // Calculate word count from HTML content
    const textOnly = (entryInput.content || '').replace(/<[^>]+>/g, ' ').trim();
    const wordCount = textOnly ? textOnly.split(/\s+/).filter(Boolean).length : 0;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    if (isNew) {
      const newEntry = {
        id: 'entry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        title: (entryInput.title || '').trim() || 'Untitled Reflection',
        date: entryInput.date || getTodayString(),
        time: timeStr,
        mood: entryInput.mood || 'peaceful',
        tags: Array.isArray(entryInput.tags) ? entryInput.tags.map(t => String(t).trim()).filter(Boolean) : [],
        photoUrl: sanitizeUrl(entryInput.photoUrl || ''),
        content: sanitizeHTML(entryInput.content || ''),
        wordCount,
        readingTime,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      this.data.journalEntries.push(newEntry);
      this.notify('journal:created', newEntry);
      return newEntry;
    } else {
      const entry = this.getJournalEntryById(entryInput.id);
      if (!entry) return null;

      Object.assign(entry, {
        title: (entryInput.title || '').trim() || 'Untitled Reflection',
        date: entryInput.date || entry.date,
        time: entryInput.time || entry.time,
        mood: entryInput.mood || entry.mood,
        tags: Array.isArray(entryInput.tags) ? entryInput.tags.map(t => String(t).trim()).filter(Boolean) : entry.tags,
        photoUrl: entryInput.photoUrl !== undefined ? sanitizeUrl(entryInput.photoUrl) : entry.photoUrl,
        content: entryInput.content !== undefined ? sanitizeHTML(entryInput.content) : entry.content,
        wordCount,
        readingTime,
        updatedAt: now.toISOString()
      });

      this.notify('journal:updated', entry);
      return entry;
    }
  }

  deleteJournalEntry(id) {
    const index = this.data.journalEntries.findIndex(e => e.id === id);
    if (index !== -1) {
      const [removed] = this.data.journalEntries.splice(index, 1);
      this.notify('journal:deleted', removed);
      return removed;
    }
    return null;
  }

  getWritingStats() {
    const entries = this.data.journalEntries || [];
    const dates = entries.map(e => e.date);
    const streakInfo = calculateStreak(dates);
    const totalWords = entries.reduce((acc, e) => acc + (e.wordCount || 0), 0);

    // Mood distribution
    const moodCounts = {
      peaceful: 0,
      productive: 0,
      thoughtful: 0,
      energetic: 0,
      low: 0
    };
    for (const e of entries) {
      if (e.mood && moodCounts[e.mood] !== undefined) {
        moodCounts[e.mood]++;
      }
    }

    return {
      totalEntries: entries.length,
      totalWords,
      currentStreak: streakInfo.current,
      longestStreak: streakInfo.longest,
      activeDaysCount: streakInfo.total,
      moodCounts
    };
  }

  // ----------------------------------------------------
  // DAILY PLANNING & REFLECTION
  // ----------------------------------------------------
  getDailyPlan(dateStr) {
    if (!this.data.dailyPlans) {
      this.data.dailyPlans = {};
    }
    if (!this.data.dailyPlans[dateStr]) {
      this.data.dailyPlans[dateStr] = {
        date: dateStr,
        topThree: [],
        morningIntention: '',
        focusWord: '',
        energyLevel: 3,
        timeBlocks: [],
        eveningReflection: {
          wins: '',
          lessons: '',
          gratitude: ''
        }
      };
    }
    return this.data.dailyPlans[dateStr];
  }

  saveDailyPlan(dateStr, updates) {
    const plan = this.getDailyPlan(dateStr);
    Object.assign(plan, updates);
    this.notify('plan:updated', { dateStr, plan });
    return plan;
  }

  // ----------------------------------------------------
  // CATEGORIES
  // ----------------------------------------------------
  getCategories() {
    return this.data.categories || [];
  }

  addCategory(name, color = '#455A64') {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const id = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '-');
    if (this.data.categories.some(c => c.id === id)) {
      return this.data.categories.find(c => c.id === id);
    }
    const newCat = { id, name: trimmed, color };
    this.data.categories.push(newCat);
    this.notify('category:created', newCat);
    return newCat;
  }

  deleteCategory(id) {
    // Preserve core categories
    if (['work', 'personal', 'study', 'health'].includes(id)) {
      return false;
    }
    this.data.categories = this.data.categories.filter(c => c.id !== id);
    this.notify('category:deleted', id);
    return true;
  }

  // ----------------------------------------------------
  // USER & SETTINGS
  // ----------------------------------------------------
  getUserSettings() {
    if (!this.data.user) {
      this.data.user = { name: '', theme: 'light', dailyQuote: true, googleAccount: { isSignedIn: false } };
    }
    if (!this.data.user.googleAccount) {
      this.data.user.googleAccount = { isSignedIn: false };
    }
    return this.data.user;
  }

  updateUserSettings(updates) {
    if (!this.data.user) this.data.user = {};
    Object.assign(this.data.user, updates);
    this.saveToStorage();
    this.notify('user:updated', this.data.user);
    return this.data.user;
  }

  signInWithGoogle(accountData) {
    if (!accountData) return this.data.user;
    if (!this.data.user) this.data.user = {};
    const userName = accountData.name || (accountData.email ? accountData.email.split('@')[0] : '') || this.data.user.name || 'Daybook Writer';
    this.data.user.googleAccount = {
      isSignedIn: true,
      uid: accountData.uid || this.data.user.googleAccount?.uid || '',
      email: accountData.email || this.data.user.googleAccount?.email || '',
      name: userName,
      avatarUrl: accountData.avatarUrl || '',
      provider: accountData.provider || 'google',
      lastSynced: new Date().toISOString()
    };
    this.data.user.name = userName;
    try {
      localStorage.setItem('daybook_onboarding_completed', 'true');
    } catch (_) {}
    this.saveToStorage();
    this.notify('user:google_signin', this.data.user);
    this.notify('user:updated', this.data.user);
    return this.data.user;
  }

  signOutGoogle() {
    if (!this.data.user) return null;
    this.data.user.googleAccount = {
      isSignedIn: false,
      email: '',
      name: '',
      avatarUrl: '',
      provider: '',
      lastSynced: null
    };
    this.saveToStorage();
    this.notify('user:google_signout', this.data.user);
    this.notify('user:updated', this.data.user);
    return this.data.user;
  }

  getRandomQuote() {
    const quotes = this.data.quotes || [];
    if (quotes.length === 0) {
      return { text: "Make each day your masterpiece.", author: "John Wooden" };
    }
    const idx = Math.floor(Math.random() * quotes.length);
    return quotes[idx];
  }

  exportData() {
    return JSON.stringify(this.data, null, 2);
  }

  importData(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.tasks || !parsed.journalEntries) {
        throw new Error('Invalid Daybook data format: missing tasks or journal entries');
      }

      // Deep sanitize imported data against malicious payloads
      if (Array.isArray(parsed.journalEntries)) {
        parsed.journalEntries = parsed.journalEntries.map(e => ({
          ...e,
          title: String(e.title || '').trim().substring(0, 200),
          content: sanitizeHTML(e.content || ''),
          photoUrl: sanitizeUrl(e.photoUrl || '')
        }));
      }

      if (Array.isArray(parsed.tasks)) {
        parsed.tasks = parsed.tasks.map(t => ({
          ...t,
          title: String(t.title || '').trim().substring(0, 300),
          notes: String(t.notes || '').trim().substring(0, 2000)
        }));
      }

      this.data = parsed;
      this.saveToStorage();
      this.notify('data:imported', this.data);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  resetToDemoData() {
    this.data = getDemoData();
    if (this.data.user) {
      this.data.user.isDemoLoaded = true;
    }
    this.saveToStorage();
    this.notify('data:reset', this.data);
  }

  clearAllData() {
    const existingGoogle = this.data?.user?.googleAccount;
    this.data = this.getCleanEmptyState();
    if (existingGoogle && existingGoogle.isSignedIn) {
      this.data.user.googleAccount = { ...existingGoogle };
      this.data.user.name = existingGoogle.name || '';
    }
    this.saveToStorage();
    this.notify('data:cleared', this.data);
  }
}

export const store = new Store();

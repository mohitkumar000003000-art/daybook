/**
 * Personal Daily Journal View for Daybook
 * Distraction-free writing editor, entry timeline/search, guided reflection prompts,
 * photo attachments, auto-saving, and markdown export.
 */
import { store } from '../store.js';
import { RichEditor } from '../components/richEditor.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { getTodayString, formatDisplayDate, formatTime } from '../utils/dateUtils.js';
import { firePaperConfetti } from '../utils/confetti.js';
import { attach3DTilt, attachButtonRipples, animateNumberCounter } from '../utils/interactiveFX.js';
import { sanitizeUrl } from '../utils/sanitize.js';

export class JournalView {
  constructor({ container, onOpenEntryId = null }) {
    this.container = container;
    this.mode = onOpenEntryId ? 'editor' : 'list'; // 'list' or 'editor'
    this.currentEntryId = onOpenEntryId;
    this.searchQuery = '';
    this.selectedMood = 'all';
    this.selectedTag = 'all';
    this.editorInstance = null;
    this.autoSaveTimer = null;
    this.isDirty = false;
  }

  setOpenEntry(id) {
    this.currentEntryId = id;
    this.mode = 'editor';
    this.render();
  }

  render() {
    if (this.mode === 'editor') {
      this.renderEditor();
    } else {
      this.renderList();
    }
  }

  // ----------------------------------------------------
  // LIST / TIMELINE VIEW
  // ----------------------------------------------------
  renderList() {
    const entries = store.getJournalEntries(this.searchQuery, this.selectedTag === 'all' ? '' : this.selectedTag, this.selectedMood === 'all' ? '' : this.selectedMood);
    const writingStats = store.getWritingStats();

    // Collect all unique tags
    const allEntries = store.getJournalEntries();
    const tagSet = new Set();
    allEntries.forEach(e => {
      if (Array.isArray(e.tags)) {
        e.tags.forEach(t => tagSet.add(t));
      }
    });
    const uniqueTags = Array.from(tagSet);

    this.container.innerHTML = `
      <div class="view-content journal-view">
        <!-- Header -->
        <header class="view-header">
          <div class="view-header-title">
            <span class="card-eyebrow">Personal Journal</span>
            <h1 class="page-title">Chronicles & Reflections</h1>
            <p class="page-subtext">A private sanctuary to unload thoughts, track personal growth, and celebrate daily moments.</p>
          </div>
          <div class="view-header-actions">
            <button class="btn btn-primary" id="new-journal-entry-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Entry
            </button>
          </div>
        </header>

        <!-- Stats Banner -->
        <div class="journal-stats-banner">
          <div class="jstat-col">
            <span class="jstat-val">
              <span id="journal-streak-num">${writingStats.currentStreak}</span> <span class="jstat-unit">days</span>
              <span class="flame-badge-pulse" style="display:inline-block; font-size:1.1rem; margin-left:4px;">🔥</span>
            </span>
            <span class="jstat-lbl">Writing Streak</span>
          </div>
          <div class="jstat-divider"></div>
          <div class="jstat-col">
            <span class="jstat-val">${writingStats.totalEntries}</span>
            <span class="jstat-lbl">Total Entries</span>
          </div>
          <div class="jstat-divider"></div>
          <div class="jstat-col">
            <span class="jstat-val">${writingStats.totalWords.toLocaleString()}</span>
            <span class="jstat-lbl">Words Written</span>
          </div>
          <div class="jstat-divider"></div>
          <div class="jstat-col">
            <span class="jstat-val">${writingStats.activeDaysCount}</span>
            <span class="jstat-lbl">Reflective Days</span>
          </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="journal-toolbar">
          <div class="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="journal-search-input" placeholder="Search entries, keywords, thoughts..." value="${escapeHtml(this.searchQuery)}" />
            ${this.searchQuery ? `<button class="clear-search-btn" id="clear-journal-search">&times;</button>` : ''}
          </div>

          <div class="journal-filters">
            <select class="form-select select-sm" id="journal-mood-select" aria-label="Filter by mood">
              <option value="all" ${this.selectedMood === 'all' ? 'selected' : ''}>All Moods</option>
              <option value="peaceful" ${this.selectedMood === 'peaceful' ? 'selected' : ''}>😌 Peaceful</option>
              <option value="productive" ${this.selectedMood === 'productive' ? 'selected' : ''}>⚡ Productive</option>
              <option value="thoughtful" ${this.selectedMood === 'thoughtful' ? 'selected' : ''}>🤔 Thoughtful</option>
              <option value="energetic" ${this.selectedMood === 'energetic' ? 'selected' : ''}>🔥 Energetic</option>
              <option value="low" ${this.selectedMood === 'low' ? 'selected' : ''}>🌧️ Gentle / Low</option>
            </select>

            ${uniqueTags.length > 0 ? `
              <select class="form-select select-sm" id="journal-tag-select" aria-label="Filter by tag">
                <option value="all" ${this.selectedTag === 'all' ? 'selected' : ''}>All Tags</option>
                ${uniqueTags.map(t => `<option value="${escapeHtml(t)}" ${this.selectedTag === t ? 'selected' : ''}>#${escapeHtml(t)}</option>`).join('')}
              </select>
            ` : ''}
          </div>
        </div>

        <!-- Entries Timeline Grid -->
        <div class="journal-entries-grid">
          ${entries.length === 0 ? this.renderEmptyList() : entries.map(entry => this.renderEntryCard(entry)).join('')}
        </div>
      </div>
    `;

    this.bindListEvents();
  }

  renderEntryCard(entry) {
    const formattedDate = formatDisplayDate(entry.date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const snippet = entry.content.replace(/<[^>]+>/g, ' ').substring(0, 180).trim() + '...';
    const moodLabels = {
      peaceful: '😌 Peaceful',
      productive: '⚡ Productive',
      thoughtful: '🤔 Thoughtful',
      energetic: '🔥 Energetic',
      low: '🌧️ Gentle'
    };

    return `
      <article class="journal-card" data-entry-id="${entry.id}">
        <div class="journal-card-top">
          <div class="journal-card-date-line">
            <span class="jcard-date">${formattedDate}</span>
            <span class="jcard-time">${formatTime(entry.time)}</span>
          </div>
          <span class="jcard-mood">${moodLabels[entry.mood] || '📝 Note'}</span>
        </div>

        ${entry.photoUrl && sanitizeUrl(entry.photoUrl) ? `
          <div class="journal-card-img-wrap">
            <img src="${escapeHtml(sanitizeUrl(entry.photoUrl))}" alt="${escapeHtml(entry.title)}" class="journal-card-thumbnail" loading="lazy" />
          </div>
        ` : ''}

        <h3 class="journal-card-title">${escapeHtml(entry.title)}</h3>
        <p class="journal-card-snippet">${escapeHtml(snippet)}</p>

        ${entry.tags && entry.tags.length > 0 ? `
          <div class="journal-card-tags">
            ${entry.tags.map(t => `<span class="journal-pill-tag">#${escapeHtml(t)}</span>`).join('')}
          </div>
        ` : ''}

        <div class="journal-card-bottom">
          <span class="jcard-stats">${entry.wordCount || 0} words • ${entry.readingTime || 1} min read</span>
          <div class="jcard-actions">
            <button class="btn btn-sm btn-text read-entry-btn" data-id="${entry.id}">Open →</button>
            <button class="icon-btn delete-entry-btn" data-id="${entry.id}" title="Delete entry" aria-label="Delete entry">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  renderEmptyList() {
    const totalEntries = store.getJournalEntries().length;
    const isFiltered = this.searchQuery.trim() || this.selectedMood !== 'all' || this.selectedTag !== 'all';

    let title = 'Every day is a fresh page';
    let msg = 'Taking just five minutes to write will help you untangle thoughts and record your life story.';
    let btnText = 'Write Your First Journal Entry';

    if (totalEntries === 0) {
      title = 'Your Journal is Empty';
      msg = 'No reflections recorded yet. Enjoy the quiet open space and begin putting your thoughts into words.';
      btnText = 'Write Your First Journal Entry';
    } else if (isFiltered) {
      title = 'No Matching Reflections';
      msg = 'No journal entries matched your current search filters.';
      btnText = 'Clear Filters';
    }

    return `
      <div class="empty-state journal-empty-state">
        <div class="empty-icon">✍️</div>
        <h3 class="empty-title">${title}</h3>
        <p class="empty-text">${msg}</p>
        <button class="btn btn-primary" id="empty-new-entry-btn">${btnText}</button>
      </div>
    `;
  }

  bindListEvents() {
    this.container.querySelector('#new-journal-entry-btn')?.addEventListener('click', () => {
      this.currentEntryId = null;
      this.mode = 'editor';
      this.render();
    });

    this.container.querySelector('#empty-new-entry-btn')?.addEventListener('click', () => {
      const totalEntries = store.getJournalEntries().length;
      if (totalEntries > 0 && (this.searchQuery.trim() || this.selectedMood !== 'all' || this.selectedTag !== 'all')) {
        this.searchQuery = '';
        this.selectedMood = 'all';
        this.selectedTag = 'all';
        this.render();
      } else {
        this.currentEntryId = null;
        this.mode = 'editor';
        this.render();
      }
    });

    // Search input
    this.container.querySelector('#journal-search-input')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.renderList();
    });

    this.container.querySelector('#clear-journal-search')?.addEventListener('click', () => {
      this.searchQuery = '';
      this.renderList();
    });

    // Mood filter
    this.container.querySelector('#journal-mood-select')?.addEventListener('change', (e) => {
      this.selectedMood = e.target.value;
      this.renderList();
    });

    // Tag filter
    this.container.querySelector('#journal-tag-select')?.addEventListener('change', (e) => {
      this.selectedTag = e.target.value;
      this.renderList();
    });

    // Click card to open
    this.container.querySelectorAll('.journal-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.delete-entry-btn')) return;
        const id = card.getAttribute('data-entry-id');
        this.currentEntryId = id;
        this.mode = 'editor';
        this.render();
      });
    });

    // Delete button
    this.container.querySelectorAll('.delete-entry-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const entry = store.getJournalEntryById(id);
        const confirmed = await modal.confirm({
          title: 'Delete Journal Entry',
          message: `Are you sure you want to permanently delete "${entry ? entry.title : 'this entry'}"? This cannot be undone.`,
          confirmText: 'Delete Entry',
          isDestructive: true
        });

        if (confirmed) {
          store.deleteJournalEntry(id);
          toast.info('Journal entry deleted');
          this.renderList();
        }
      });
    });

    attach3DTilt(this.container.querySelectorAll('.journal-card'));
    attachButtonRipples(this.container);

    const streakEl = this.container.querySelector('#journal-streak-num');
    if (streakEl) {
      const writingStats = store.getWritingStats();
      animateNumberCounter(streakEl, writingStats.currentStreak, 400);
    }
  }

  // ----------------------------------------------------
  // DISTRACTION-FREE WRITING EDITOR
  // ----------------------------------------------------
  renderEditor() {
    const isNew = !this.currentEntryId;
    let entry = isNew ? null : store.getJournalEntryById(this.currentEntryId);

    const now = new Date();
    const defaultDate = getTodayString();
    const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const dateVal = entry ? entry.date : defaultDate;
    const timeVal = entry ? entry.time : defaultTime;
    const titleVal = entry ? entry.title : '';
    const moodVal = entry ? entry.mood : 'peaceful';
    const tagsVal = entry && entry.tags ? entry.tags.join(', ') : '';
    const photoUrl = entry ? entry.photoUrl : '';
    const contentVal = entry ? entry.content : '';

    this.container.innerHTML = `
      <div class="view-content journal-editor-view">
        <!-- Top Sticky Control Bar -->
        <div class="editor-header-bar">
          <div class="editor-header-left">
            <button class="btn btn-secondary btn-sm" id="editor-back-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              All Entries
            </button>
            <span class="editor-status-text" id="editor-status-badge">Ready</span>
          </div>

          <div class="editor-header-right">
            <button class="btn btn-secondary btn-sm" id="editor-export-md" title="Export as clean Markdown file">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export MD
            </button>
            ${!isNew ? `
              <button class="btn btn-sm btn-text text-danger" id="editor-delete-entry-btn" title="Delete entry">
                Delete
              </button>
            ` : ''}
            <button class="btn btn-primary btn-sm" id="editor-save-btn">
              Save Entry
            </button>
          </div>
        </div>

        <!-- Guided Reflection Questions Drawer / Helper -->
        <div class="reflection-prompts-bar">
          <div class="prompts-bar-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>Need inspiration? Insert reflection prompts:</span>
          </div>
          <div class="prompt-chips">
            <button type="button" class="prompt-chip" data-prompt="What went well today?">
              🌟 What went well today?
            </button>
            <button type="button" class="prompt-chip" data-prompt="What did I learn today?">
              💡 What did I learn today?
            </button>
            <button type="button" class="prompt-chip" data-prompt="What could I improve tomorrow?">
              🌱 What could I improve tomorrow?
            </button>
            <button type="button" class="prompt-chip" data-prompt="What am I grateful for?">
              🙏 What am I grateful for?
            </button>
            <button type="button" class="prompt-chip" data-prompt="all">
              ✨ Insert Full Daily Review
            </button>
          </div>
        </div>

        <!-- Main Editorial Workspace -->
        <div class="editor-paper-container card">
          <!-- Metadata Bar: Date, Time, Mood, Tags -->
          <div class="editor-meta-inputs">
            <div class="meta-field">
              <label for="entry-date-input" class="meta-label">Date</label>
              <input type="date" id="entry-date-input" class="form-input meta-input" value="${dateVal}" />
            </div>

            <div class="meta-field">
              <label for="entry-time-input" class="meta-label">Time</label>
              <input type="time" id="entry-time-input" class="form-input meta-input" value="${timeVal}" />
            </div>

            <div class="meta-field meta-field-mood">
              <label class="meta-label">Mood</label>
              <div class="mood-picker-group has-selection" id="mood-picker-group">
                <button type="button" class="mood-btn ${moodVal === 'peaceful' ? 'selected' : ''}" data-mood="peaceful">😌 Peaceful</button>
                <button type="button" class="mood-btn ${moodVal === 'productive' ? 'selected' : ''}" data-mood="productive">⚡ Productive</button>
                <button type="button" class="mood-btn ${moodVal === 'thoughtful' ? 'selected' : ''}" data-mood="thoughtful">🤔 Thoughtful</button>
                <button type="button" class="mood-btn ${moodVal === 'energetic' ? 'selected' : ''}" data-mood="energetic">🔥 Energetic</button>
                <button type="button" class="mood-btn ${moodVal === 'low' ? 'selected' : ''}" data-mood="low">🌧️ Gentle</button>
              </div>
              <input type="hidden" id="entry-mood-select" value="${moodVal}" />
            </div>

            <div class="meta-field meta-field-tags">
              <label for="entry-tags-input" class="meta-label">Tags (comma separated)</label>
              <input type="text" id="entry-tags-input" class="form-input meta-input" placeholder="e.g., Deep Work, Nature, Gratitude" value="${escapeHtml(tagsVal)}" />
            </div>
          </div>

          <!-- Title Input -->
          <input type="text" id="entry-title-input" class="journal-title-input" placeholder="Title your reflection..." value="${escapeHtml(titleVal)}" maxlength="150" />

          <!-- Rich Text Container -->
          <div id="rich-editor-mount"></div>
        </div>
      </div>
    `;

    // Mount RichEditor
    const mountEl = this.container.querySelector('#rich-editor-mount');
    this.editorInstance = new RichEditor({
      container: mountEl,
      initialContent: contentVal,
      onContentChange: () => {
        this.isDirty = true;
        this.scheduleAutoSave();
      }
    });

    if (photoUrl) {
      this.editorInstance.setPhotoUrl(photoUrl);
    }

    this.bindEditorEvents();
  }

  bindEditorEvents() {
    const titleInput = this.container.querySelector('#entry-title-input');
    const dateInput = this.container.querySelector('#entry-date-input');
    const timeInput = this.container.querySelector('#entry-time-input');
    const moodSelect = this.container.querySelector('#entry-mood-select');
    const tagsInput = this.container.querySelector('#entry-tags-input');

    // Mood selector buttons: scales up the emoji tapped and fades the others
    const moodBtns = this.container.querySelectorAll('.mood-btn');
    moodBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        moodBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        if (moodSelect) {
          moodSelect.value = btn.getAttribute('data-mood');
        }
        this.isDirty = true;
        this.scheduleAutoSave();
      });
    });

    // Zen typing mode: screen dims and writing area grows when you start typing
    const editorView = this.container.querySelector('.journal-editor-view');
    let zenTimer = null;
    const enterZenFocus = () => {
      editorView?.classList.add('zen-focus');
      clearTimeout(zenTimer);
      zenTimer = setTimeout(() => {
        editorView?.classList.remove('zen-focus');
      }, 5500);
    };

    titleInput?.addEventListener('input', enterZenFocus);
    titleInput?.addEventListener('focus', enterZenFocus);
    titleInput?.addEventListener('blur', () => {
      editorView?.classList.remove('zen-focus');
    });

    const editableEl = this.container.querySelector('#rich-editor-mount [contenteditable="true"]');
    editableEl?.addEventListener('input', enterZenFocus);
    editableEl?.addEventListener('focus', enterZenFocus);
    editableEl?.addEventListener('blur', () => {
      editorView?.classList.remove('zen-focus');
    });

    [titleInput, dateInput, timeInput, moodSelect, tagsInput].forEach(el => {
      el?.addEventListener('input', () => {
        this.isDirty = true;
        this.scheduleAutoSave();
      });
    });

    // Back button
    this.container.querySelector('#editor-back-btn')?.addEventListener('click', () => {
      if (this.isDirty) {
        this.saveCurrentEntry(false);
      }
      this.mode = 'list';
      this.currentEntryId = null;
      this.render();
    });

    // Save button
    this.container.querySelector('#editor-save-btn')?.addEventListener('click', () => {
      this.saveCurrentEntry(true);
    });

    // Export MD button
    this.container.querySelector('#editor-export-md')?.addEventListener('click', () => {
      this.exportAsMarkdown();
    });

    // Delete button
    this.container.querySelector('#editor-delete-entry-btn')?.addEventListener('click', async () => {
      if (!this.currentEntryId) return;
      const confirmed = await modal.confirm({
        title: 'Delete Journal Entry',
        message: 'Are you sure you want to delete this entry? This cannot be undone.',
        confirmText: 'Delete',
        isDestructive: true
      });
      if (confirmed) {
        store.deleteJournalEntry(this.currentEntryId);
        toast.info('Entry deleted');
        this.mode = 'list';
        this.currentEntryId = null;
        this.render();
      }
    });

    // Reflection Prompts insertion
    this.container.querySelectorAll('.prompt-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const promptKey = chip.getAttribute('data-prompt');
        let htmlSnippet = '';
        if (promptKey === 'all') {
          htmlSnippet = `
            <h3>Daily Evening Reflection</h3>
            <p><strong>What went well today?</strong></p>
            <p></p>
            <p><strong>What did I learn today?</strong></p>
            <p></p>
            <p><strong>What could I improve tomorrow?</strong></p>
            <p></p>
            <p><strong>What am I grateful for?</strong></p>
            <p></p>
          `;
        } else {
          htmlSnippet = `<p><strong>${escapeHtml(promptKey)}</strong></p><p></p>`;
        }
        this.editorInstance.insertTextAtCursor(htmlSnippet);
        toast.info('Prompt inserted');
      });
    });

    attachButtonRipples(this.container);
  }

  scheduleAutoSave() {
    clearTimeout(this.autoSaveTimer);
    const badge = this.container.querySelector('#editor-status-badge');
    if (badge) badge.textContent = 'Saving changes...';

    this.autoSaveTimer = setTimeout(() => {
      this.saveCurrentEntry(false);
      if (badge) badge.textContent = 'Saved locally';
    }, 2200);
  }

  saveCurrentEntry(showToast = true) {
    const title = this.container.querySelector('#entry-title-input')?.value.trim() || 'Untitled Reflection';
    const date = this.container.querySelector('#entry-date-input')?.value || getTodayString();
    const time = this.container.querySelector('#entry-time-input')?.value || '12:00';
    const mood = this.container.querySelector('#entry-mood-select')?.value || 'peaceful';
    const tagsStr = this.container.querySelector('#entry-tags-input')?.value || '';
    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
    const content = this.editorInstance ? this.editorInstance.getContent() : '';
    const photoUrl = this.editorInstance ? this.editorInstance.photoUrl : '';

    const entryData = {
      id: this.currentEntryId,
      title,
      date,
      time,
      mood,
      tags,
      photoUrl,
      content
    };

    const saved = store.saveJournalEntry(entryData);
    if (saved) {
      this.currentEntryId = saved.id;
      this.isDirty = false;
      const badge = this.container.querySelector('#editor-status-badge');
      if (badge) badge.textContent = 'Saved locally';
      if (showToast) {
        firePaperConfetti(window.innerWidth / 2, window.innerHeight * 0.4, 30);
        toast.success('Journal entry saved');
      }
    }
  }

  exportAsMarkdown() {
    const title = this.container.querySelector('#entry-title-input')?.value.trim() || 'Untitled Reflection';
    const date = this.container.querySelector('#entry-date-input')?.value || getTodayString();
    const time = this.container.querySelector('#entry-time-input')?.value || '12:00';
    const mood = this.container.querySelector('#entry-mood-select')?.value || 'peaceful';
    const tagsStr = this.container.querySelector('#entry-tags-input')?.value || '';
    const content = this.editorInstance ? this.editorInstance.getContent() : '';

    // Convert simple HTML tags to markdown
    let md = content
      .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<blockquote>(.*?)<\/blockquote>/gi, '> $1\n\n')
      .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i>(.*?)<\/i>/gi, '*$1*')
      .replace(/<li>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<ul>|<\/ul>|<ol>|<\/ol>/gi, '\n')
      .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<hr\s*\/?>/gi, '\n---\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '');

    const fileContent = `---
title: "${title}"
date: ${date} ${time}
mood: ${mood}
tags: [${tagsStr}]
---

# ${title}

${md}
`;

    const blob = new Blob([fileContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${date}_${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Markdown entry exported');
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

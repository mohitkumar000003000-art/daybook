/**
 * Rich Text Journal Editor Component
 * Supports formatting commands, image attachments, word count, and prompt insertions.
 */

import { sanitizeHTML } from '../utils/sanitize.js';

export class RichEditor {
  constructor({ container, onContentChange, initialContent = '' }) {
    this.container = container;
    this.onContentChange = onContentChange;
    this.initialContent = initialContent;
    this.photoUrl = '';
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="rich-editor-wrapper">
        <div class="editor-toolbar" role="toolbar" aria-label="Text Formatting">
          <div class="toolbar-group">
            <button type="button" class="toolbar-btn" data-command="bold" title="Bold (Ctrl+B)">
              <strong>B</strong>
            </button>
            <button type="button" class="toolbar-btn" data-command="italic" title="Italic (Ctrl+I)">
              <em>I</em>
            </button>
            <button type="button" class="toolbar-btn" data-command="underline" title="Underline (Ctrl+U)">
              <u>U</u>
            </button>
            <button type="button" class="toolbar-btn" data-command="strikeThrough" title="Strikethrough">
              <s>S</s>
            </button>
          </div>

          <div class="toolbar-divider"></div>

          <div class="toolbar-group">
            <button type="button" class="toolbar-btn" data-command="formatBlock" data-val="h2" title="Heading 2">
              H2
            </button>
            <button type="button" class="toolbar-btn" data-command="formatBlock" data-val="h3" title="Heading 3">
              H3
            </button>
            <button type="button" class="toolbar-btn" data-command="formatBlock" data-val="p" title="Paragraph">
              ¶
            </button>
          </div>

          <div class="toolbar-divider"></div>

          <div class="toolbar-group">
            <button type="button" class="toolbar-btn" data-command="insertUnorderedList" title="Bulleted List">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </button>
            <button type="button" class="toolbar-btn" data-command="insertOrderedList" title="Numbered List">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
            </button>
            <button type="button" class="toolbar-btn" data-command="formatBlock" data-val="blockquote" title="Quote">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/></svg>
            </button>
            <button type="button" class="toolbar-btn" data-command="insertHorizontalRule" title="Divider Line">
              —
            </button>
          </div>

          <div class="toolbar-divider"></div>

          <div class="toolbar-group">
            <label class="toolbar-btn file-upload-label" title="Attach Photo">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <input type="file" class="editor-file-input" accept="image/*" style="display:none;" />
            </label>
            <button type="button" class="toolbar-btn" data-command="removeFormat" title="Clear Formatting">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <!-- Photo preview area if image attached -->
        <div class="editor-photo-preview-wrap" style="display: none;">
          <div class="editor-photo-card">
            <img class="editor-photo-img" src="" alt="Attached journal photo" />
            <button type="button" class="editor-photo-remove-btn" title="Remove Photo">&times;</button>
          </div>
        </div>

        <!-- Editable content area -->
        <div class="editor-content-area" contenteditable="true" spellcheck="true" role="textbox" aria-multiline="true" placeholder="Pour your thoughts onto the page..."></div>

        <div class="editor-statusbar">
          <div class="editor-stats">
            <span class="editor-word-count">0 words</span>
            <span class="editor-dot-separator">•</span>
            <span class="editor-read-time">1 min read</span>
          </div>
          <div class="editor-autosave-indicator">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
            <span class="save-status-text">Draft ready</span>
          </div>
        </div>
      </div>
    `;

    this.contentArea = this.container.querySelector('.editor-content-area');
    this.wordCountEl = this.container.querySelector('.editor-word-count');
    this.readTimeEl = this.container.querySelector('.editor-read-time');
    this.saveStatusEl = this.container.querySelector('.save-status-text');
    this.photoWrap = this.container.querySelector('.editor-photo-preview-wrap');
    this.photoImg = this.container.querySelector('.editor-photo-img');
    this.photoRemoveBtn = this.container.querySelector('.editor-photo-remove-btn');
    this.fileInput = this.container.querySelector('.editor-file-input');

    if (this.initialContent) {
      this.contentArea.innerHTML = sanitizeHTML(this.initialContent);
      this.updateStats();
    }
  }

  bindEvents() {
    // Toolbar buttons
    const buttons = this.container.querySelectorAll('.toolbar-btn[data-command]');
    buttons.forEach(btn => {
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Keep focus inside editor
        const cmd = btn.getAttribute('data-command');
        const val = btn.getAttribute('data-val') || null;

        if (cmd === 'formatBlock' && val) {
          document.execCommand(cmd, false, `<${val}>`);
        } else {
          document.execCommand(cmd, false, val);
        }
        this.handleContentChange();
      });
    });

    // Content typing & paste
    this.contentArea.addEventListener('input', () => {
      this.handleContentChange();
    });

    // Photo file attachment
    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Limit size to ~4MB
      if (file.size > 4 * 1024 * 1024) {
        alert('Please choose an image under 4MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        this.photoUrl = event.target.result;
        this.updatePhotoDisplay();
        this.handleContentChange();
      };
      reader.readAsDataURL(file);
    });

    // Remove photo
    this.photoRemoveBtn.addEventListener('click', () => {
      this.photoUrl = '';
      this.fileInput.value = '';
      this.updatePhotoDisplay();
      this.handleContentChange();
    });
  }

  setPhotoUrl(url) {
    this.photoUrl = url || '';
    this.updatePhotoDisplay();
  }

  updatePhotoDisplay() {
    if (this.photoUrl) {
      this.photoImg.src = this.photoUrl;
      this.photoWrap.style.display = 'block';
    } else {
      this.photoImg.src = '';
      this.photoWrap.style.display = 'none';
    }
  }

  handleContentChange() {
    this.updateStats();
    this.setSaveStatus('Draft editing...');
    if (this.onContentChange) {
      this.onContentChange({
        content: this.getContent(),
        wordCount: this.getWordCount(),
        readingTime: this.getReadingTime(),
        photoUrl: this.photoUrl
      });
    }
  }

  updateStats() {
    const text = this.contentArea.innerText.trim();
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const readTime = Math.max(1, Math.ceil(words / 200));

    this.wordCountEl.textContent = `${words} ${words === 1 ? 'word' : 'words'}`;
    this.readTimeEl.textContent = `${readTime} min read`;
  }

  setSaveStatus(status) {
    if (this.saveStatusEl) {
      this.saveStatusEl.textContent = status;
    }
  }

  getContent() {
    return this.contentArea.innerHTML;
  }

  setContent(html) {
    this.contentArea.innerHTML = sanitizeHTML(html || '');
    this.updateStats();
  }

  getWordCount() {
    const text = this.contentArea.innerText.trim();
    return text ? text.split(/\s+/).filter(Boolean).length : 0;
  }

  getReadingTime() {
    return Math.max(1, Math.ceil(this.getWordCount() / 200));
  }

  insertTextAtCursor(htmlToInsert) {
    this.contentArea.focus();
    const sel = window.getSelection();
    if (sel.getRangeAt && sel.rangeCount) {
      const range = sel.getRangeAt(0);
      range.deleteContents();

      const el = document.createElement('div');
      el.innerHTML = htmlToInsert;
      const frag = document.createDocumentFragment();
      let node;
      let lastNode;
      while ((node = el.firstChild)) {
        lastNode = frag.appendChild(node);
      }
      range.insertNode(frag);

      if (lastNode) {
        range.setStartAfter(lastNode);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    } else {
      this.contentArea.innerHTML += htmlToInsert;
    }
    this.handleContentChange();
  }
}

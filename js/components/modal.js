/**
 * Modal System for Daybook
 */

class ModalManager {
  constructor() {
    this.activeModal = null;
    this.handleKeyDown = this.handleKeyDown.bind(this);
    window.addEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown(e) {
    if (e.key === 'Escape' && this.activeModal) {
      this.close();
    }
  }

  open(title, contentHtml, options = {}) {
    this.close(); // Close any currently open modal

    const overlay = document.createElement('div');
    overlay.className = 'modal-backdrop';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'modal-title');

    const maxWidth = options.maxWidth ? `style="max-width: ${options.maxWidth}"` : '';

    overlay.innerHTML = `
      <div class="modal-dialog ${options.dialogClass || ''}" ${maxWidth}>
        <div class="modal-mobile-handle" aria-hidden="true"></div>
        <div class="modal-header">
          <h2 id="modal-title" class="modal-title">${title}</h2>
          <button class="modal-close-btn" aria-label="Close dialog">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          ${contentHtml}
        </div>
        ${options.footerHtml ? `<div class="modal-footer">${options.footerHtml}</div>` : ''}
      </div>
    `;

    document.body.appendChild(overlay);
    this.activeModal = overlay;

    // Prevent background scrolling
    document.body.classList.add('modal-open');

    // Focus close button or first input
    const firstInput = overlay.querySelector('input, textarea, select, button.primary-btn');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 50);
    }

    // Close listeners
    overlay.querySelector('.modal-close-btn').addEventListener('click', () => this.close());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.close();
      }
    });

    if (options.onMount) {
      options.onMount(overlay);
    }

    requestAnimationFrame(() => {
      overlay.classList.add('modal-visible');
    });

    return overlay;
  }

  close() {
    if (!this.activeModal) return;
    const modal = this.activeModal;
    modal.classList.remove('modal-visible');
    this.activeModal = null;
    document.body.classList.remove('modal-open');

    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }, 200);
  }

  confirm({ title = 'Confirm Action', message = 'Are you sure?', confirmText = 'Confirm', cancelText = 'Cancel', isDestructive = false }) {
    return new Promise((resolve) => {
      const footerHtml = `
        <button class="btn btn-secondary modal-cancel-btn">${cancelText}</button>
        <button class="btn ${isDestructive ? 'btn-danger' : 'btn-primary'} modal-confirm-btn">${confirmText}</button>
      `;

      const overlay = this.open(title, `<p class="modal-confirm-msg">${message}</p>`, {
        maxWidth: '440px',
        footerHtml,
        onMount: (el) => {
          el.querySelector('.modal-cancel-btn').addEventListener('click', () => {
            this.close();
            resolve(false);
          });
          el.querySelector('.modal-confirm-btn').addEventListener('click', () => {
            this.close();
            resolve(true);
          });
        }
      });
    });
  }
}

export const modal = new ModalManager();

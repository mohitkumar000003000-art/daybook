/**
 * Email & Gmail Validation Utility for Daybook
 * Validates email structure, verifies strict Gmail formatting rules,
 * detects common typos (e.g. @gamil.com), and provides interactive UI feedback.
 */

const DOMAIN_TYPOS = {
  'gamil.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmaol.com': 'gmail.com',
  'gmaul.com': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.con': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahou.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'iclud.com': 'icloud.com'
};

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'throwawaymail.com',
  'yopmail.com',
  'sharklasers.com',
  'trashmail.com'
]);

/**
 * Validates any email address with special rules for Gmail
 * @param {string} email
 * @returns {{
 *   isValid: boolean,
 *   error: string | null,
 *   suggestion: string | null,
 *   isGmail: boolean,
 *   normalizedEmail: string,
 *   message: string
 * }}
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      error: 'Please enter an email address.',
      suggestion: null,
      isGmail: false,
      normalizedEmail: '',
      message: ''
    };
  }

  const trimmed = email.trim();

  // 1. Whitespace check
  if (/\s/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Email cannot contain spaces.',
      suggestion: null,
      isGmail: false,
      normalizedEmail: trimmed,
      message: ''
    };
  }

  // 2. Exactly one @ check
  const atCount = (trimmed.match(/@/g) || []).length;
  if (atCount === 0) {
    return {
      isValid: false,
      error: 'Email must include "@" and a domain (e.g., name@gmail.com).',
      suggestion: null,
      isGmail: false,
      normalizedEmail: trimmed,
      message: ''
    };
  }
  if (atCount > 1) {
    return {
      isValid: false,
      error: 'Email cannot contain more than one "@" symbol.',
      suggestion: null,
      isGmail: false,
      normalizedEmail: trimmed,
      message: ''
    };
  }

  const [username, rawDomain] = trimmed.split('@');
  const domain = (rawDomain || '').toLowerCase();

  // 3. Username checks
  if (!username) {
    return {
      isValid: false,
      error: 'Username before "@" is missing.',
      suggestion: null,
      isGmail: false,
      normalizedEmail: trimmed,
      message: ''
    };
  }

  if (username.startsWith('.') || username.endsWith('.')) {
    return {
      isValid: false,
      error: 'Email username cannot start or end with a period.',
      suggestion: null,
      isGmail: false,
      normalizedEmail: trimmed,
      message: ''
    };
  }

  if (username.includes('..')) {
    return {
      isValid: false,
      error: 'Email username cannot contain consecutive periods (..).',
      suggestion: null,
      isGmail: false,
      normalizedEmail: trimmed,
      message: ''
    };
  }

  // 4. Domain checks
  if (!domain) {
    return {
      isValid: false,
      error: 'Domain name after "@" is missing (e.g. gmail.com).',
      suggestion: null,
      isGmail: false,
      normalizedEmail: trimmed,
      message: ''
    };
  }

  if (!domain.includes('.')) {
    return {
      isValid: false,
      error: 'Domain must have an extension like .com or .org.',
      suggestion: null,
      isGmail: false,
      normalizedEmail: trimmed,
      message: ''
    };
  }

  if (domain.startsWith('.') || domain.endsWith('.')) {
    return {
      isValid: false,
      error: 'Domain cannot begin or end with a period.',
      suggestion: null,
      isGmail: false,
      normalizedEmail: trimmed,
      message: ''
    };
  }

  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2 || !/^[a-z]+$/.test(tld)) {
    return {
      isValid: false,
      error: 'Domain extension is invalid (must be at least 2 letters, e.g. .com).',
      suggestion: null,
      isGmail: false,
      normalizedEmail: trimmed,
      message: ''
    };
  }

  // 5. Typo Suggestion Check
  let suggestion = null;
  if (DOMAIN_TYPOS[domain]) {
    const suggestedDomain = DOMAIN_TYPOS[domain];
    suggestion = `${username}@${suggestedDomain}`;
    return {
      isValid: false,
      error: `Common typo detected. Did you mean @${suggestedDomain}?`,
      suggestion,
      isGmail: suggestedDomain === 'gmail.com',
      normalizedEmail: suggestion,
      message: ''
    };
  }

  // 6. Disposable email warning
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      isValid: false,
      error: 'Disposable email addresses are not supported. Please use a permanent email or Gmail.',
      suggestion: null,
      isGmail: false,
      normalizedEmail: trimmed,
      message: ''
    };
  }

  // 7. Strict Gmail validation
  const isGmail = domain === 'gmail.com' || domain === 'googlemail.com';
  if (isGmail) {
    // Gmail usernames length between 4 and 30 characters
    if (username.length < 4) {
      return {
        isValid: false,
        error: `Gmail usernames must be at least 4 characters (currently ${username.length}).`,
        suggestion: null,
        isGmail: true,
        normalizedEmail: trimmed,
        message: ''
      };
    }

    if (username.length > 30) {
      return {
        isValid: false,
        error: `Gmail usernames cannot exceed 30 characters (currently ${username.length}).`,
        suggestion,
        isGmail: true,
        normalizedEmail: trimmed,
        message: ''
      };
    }

    // Gmail usernames only allow letters, numbers, and periods
    if (/[^a-zA-Z0-9.]/.test(username)) {
      return {
        isValid: false,
        error: 'Gmail usernames can only contain letters (a-z), numbers (0-9), and periods (.).',
        suggestion,
        isGmail: true,
        normalizedEmail: trimmed,
        message: ''
      };
    }
  } else {
    // General RFC email validation regex
    const generalEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!generalEmailRegex.test(trimmed)) {
      return {
        isValid: false,
        error: 'Please enter a valid email address.',
        suggestion,
        isGmail: false,
        normalizedEmail: trimmed,
        message: ''
      };
    }
  }

  const normalizedEmail = `${username}@${domain}`;

  return {
    isValid: true,
    error: null,
    suggestion,
    isGmail,
    normalizedEmail,
    message: isGmail ? 'Valid Gmail address ✓' : 'Valid email address ✓'
  };
}

/**
 * Attaches real-time feedback and typo suggestion UI to an email input
 * @param {HTMLInputElement} inputEl
 * @param {HTMLElement} feedbackEl
 * @param {Function} [onStatusChange] Callback receiving (isValid, result)
 */
export function attachEmailFeedback(inputEl, feedbackEl, onStatusChange = null) {
  if (!inputEl || !feedbackEl) return;

  function update() {
    const val = inputEl.value;
    if (!val || val.trim() === '') {
      inputEl.classList.remove('input-invalid', 'input-valid');
      feedbackEl.innerHTML = '';
      if (onStatusChange) onStatusChange(false, null);
      return;
    }

    const res = validateEmail(val);

    if (!res.isValid) {
      inputEl.classList.add('input-invalid');
      inputEl.classList.remove('input-valid');

      let suggestionHtml = '';
      if (res.suggestion) {
        suggestionHtml = `
          <button type="button" class="email-suggestion-chip" data-suggest="${escapeAttr(res.suggestion)}">
            <span>Did you mean <strong>${escapeHtml(res.suggestion)}</strong>?</span>
            <span class="chip-action">Click to fix</span>
          </button>
        `;
      }

      feedbackEl.innerHTML = `
        <div class="email-feedback-error">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>${escapeHtml(res.error)}</span>
        </div>
        ${suggestionHtml}
      `;

      // Bind click on suggestion chip
      const chip = feedbackEl.querySelector('.email-suggestion-chip');
      chip?.addEventListener('click', () => {
        inputEl.value = res.suggestion;
        update();
        inputEl.focus();
      });

      if (onStatusChange) onStatusChange(false, res);
    } else {
      inputEl.classList.remove('input-invalid');
      inputEl.classList.add('input-valid');

      let suggestionHtml = '';
      if (res.suggestion) {
        suggestionHtml = `
          <button type="button" class="email-suggestion-chip" data-suggest="${escapeAttr(res.suggestion)}">
            <span>Did you mean <strong>${escapeHtml(res.suggestion)}</strong>?</span>
            <span class="chip-action">Click to fix</span>
          </button>
        `;
      }

      feedbackEl.innerHTML = `
        <div class="email-feedback-valid">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          <span>${escapeHtml(res.message)}</span>
        </div>
        ${suggestionHtml}
      `;

      const chip = feedbackEl.querySelector('.email-suggestion-chip');
      chip?.addEventListener('click', () => {
        inputEl.value = res.suggestion;
        update();
        inputEl.focus();
      });

      if (onStatusChange) onStatusChange(true, res);
    }
  }

  inputEl.addEventListener('input', update);
  inputEl.addEventListener('blur', update);
  inputEl.addEventListener('change', update);
  inputEl.addEventListener('keyup', update);
  inputEl._triggerEmailValidation = update;
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

function escapeAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;');
}

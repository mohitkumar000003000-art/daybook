/**
 * Security & Sanitization Utilities for Daybook
 * Prevents Cross-Site Scripting (XSS), script injection,
 * and malicious URI protocol handlers (e.g. javascript:)
 */

const ALLOWED_TAGS = new Set([
  'p', 'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'ul', 'ol', 'li', 'br', 'hr', 'span', 'div', 'mark', 'sub', 'sup'
]);

const ALLOWED_ATTRS = new Set([
  'class', 'style', 'title'
]);

/**
 * Sanitizes rich text HTML content from journal reflections.
 * Strips script tags, iframes, inline event handlers (onclick, onerror, etc.),
 * and dangerous protocols.
 */
export function sanitizeHTML(dirtyHtml) {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(dirtyHtml, 'text/html');

  function cleanNode(node) {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const tagName = child.tagName.toLowerCase();
        
        // Strip forbidden elements immediately
        if (!ALLOWED_TAGS.has(tagName)) {
          // If it's a dangerous container (script, style, iframe, etc.), remove entirely
          if (['script', 'style', 'iframe', 'object', 'embed', 'form', 'base', 'link'].includes(tagName)) {
            child.remove();
            continue;
          }
          // Otherwise unwrap its contents safely
          while (child.firstChild) {
            node.insertBefore(child.firstChild, child);
          }
          child.remove();
          continue;
        }

        // Strip disallowed attributes or attributes starting with "on"
        const attrs = Array.from(child.attributes);
        for (const attr of attrs) {
          const attrName = attr.name.toLowerCase();
          const attrValue = attr.value.toLowerCase().trim();

          // Block all on* handlers (onerror, onclick, onload, etc.)
          if (attrName.startsWith('on')) {
            child.removeAttribute(attr.name);
            continue;
          }

          // Block javascript: or vbscript: or data: in href/src
          if (['href', 'src', 'action'].includes(attrName)) {
            if (attrValue.startsWith('javascript:') || attrValue.startsWith('vbscript:') || attrValue.startsWith('data:text/html')) {
              child.removeAttribute(attr.name);
              continue;
            }
          }

          // Strip style attributes containing expression() or url(javascript:...)
          if (attrName === 'style') {
            if (attrValue.includes('expression') || attrValue.includes('javascript:')) {
              child.removeAttribute(attr.name);
              continue;
            }
          }

          if (!ALLOWED_ATTRS.has(attrName)) {
            child.removeAttribute(attr.name);
          }
        }

        cleanNode(child);
      }
    }
  }

  cleanNode(doc.body);
  return doc.body.innerHTML;
}

/**
 * Validates and sanitizes image / photo URLs
 * Only permits http:, https:, or safe image data: URLs
 */
export function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  try {
    const parsed = new URL(trimmed, window.location.origin);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return trimmed;
    }
    if (trimmed.startsWith('data:image/')) {
      return trimmed;
    }
  } catch (e) {
    // If not a valid absolute URL, check if it's a relative path starting with / or ./
    if (trimmed.startsWith('/') || trimmed.startsWith('./')) {
      return trimmed;
    }
  }

  return '';
}

/**
 * Escapes plain text strings for safe HTML insertion
 */
export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

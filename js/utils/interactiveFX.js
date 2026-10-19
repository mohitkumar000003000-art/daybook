/**
 * Interactive Visual FX Engine for Daybook
 * - 3D Card Tilt with realistic perspective
 * - Click Ripple effects on buttons
 * - Animated Number Counter roll-ups
 */

export function attach3DTilt(elements) {
  if (!elements || elements.length === 0) return;
  // Disable tilt on touch devices or if reduced motion is requested
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (prefersReduced || !canHover) return;

  elements.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate tilt degrees (subtle, max ~4deg)
      const rotateX = ((centerY - y) / centerY) * 4;
      const rotateY = ((x - centerX) / centerX) * 4;

      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-2px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

export function attachButtonRipples(container = document) {
  container.querySelectorAll('.btn:not(.has-ripple)').forEach(btn => {
    btn.classList.add('has-ripple');
    btn.addEventListener('click', (e) => {
      const rect = btn.getBoundingClientRect();
      const circle = document.createElement('span');
      const diameter = Math.max(rect.width, rect.height);
      const radius = diameter / 2;

      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${e.clientX - rect.left - radius}px`;
      circle.style.top = `${e.clientY - rect.top - radius}px`;
      circle.classList.add('ripple-wave');

      const ripple = btn.querySelector('.ripple-wave');
      if (ripple) {
        ripple.remove();
      }

      btn.appendChild(circle);
      setTimeout(() => circle.remove(), 600);
    });
  });
}

export function animateNumberCounter(element, targetNumber, duration = 350, prefix = '', suffix = '') {
  if (!element) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    element.textContent = `${prefix}${targetNumber.toLocaleString()}${suffix}`;
    return;
  }
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease-out cubic
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const currentVal = Math.round(start + (targetNumber - start) * easeProgress);

    element.textContent = `${prefix}${currentVal.toLocaleString()}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = `${prefix}${targetNumber.toLocaleString()}${suffix}`;
    }
  }

  requestAnimationFrame(update);
}

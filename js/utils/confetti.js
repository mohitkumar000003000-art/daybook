/**
 * Enhanced Celebration Confetti & Sparkles Particle Engine
 */

const PALETTE = ['#9E472A', '#D47758', '#E69A32', '#436A57', '#2B5B84', '#F4EBE6', '#BA68C8'];

export function firePaperConfetti(originX = window.innerWidth / 2, originY = window.innerHeight / 2, count = 35) {
  let container = document.querySelector('.celebration-particle-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'celebration-particle-container';
    document.body.appendChild(container);
  }

  for (let i = 0; i < count; i++) {
    const isStar = Math.random() > 0.65;
    const el = document.createElement('div');
    el.className = isStar ? 'sparkle-star' : 'paper-confetti';
    
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    const angle = Math.random() * 2 * Math.PI;
    const distance = 45 + Math.random() * 140;
    const deltaX = Math.cos(angle) * distance;
    const deltaY = Math.sin(angle) * distance - 40; // upward bias then gravity
    const rot = (Math.random() - 0.5) * 800;
    const sizeW = 7 + Math.random() * 5;
    const sizeH = 10 + Math.random() * 8;

    el.style.backgroundColor = color;
    el.style.left = `${originX}px`;
    el.style.top = `${originY}px`;
    if (!isStar) {
      el.style.width = `${sizeW}px`;
      el.style.height = `${sizeH}px`;
    }
    el.style.setProperty('--deltaX', `${deltaX}px`);
    el.style.setProperty('--deltaY', `${deltaY + 70}px`);
    el.style.setProperty('--rot', `${rot}deg`);

    container.appendChild(el);

    setTimeout(() => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }, 1500);
  }
}

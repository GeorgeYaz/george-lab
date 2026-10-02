'use strict';
const printButton = document.getElementById('print-cv');
if (printButton) {
  printButton.hidden = false;
  printButton.addEventListener('click', () => window.print());
}
document.getElementById('year').textContent = String(new Date().getFullYear());


// Scramble decorative glyphs without changing the name's layout or accessible label.
(() => {
  const root = document.documentElement;
  const letters = Array.from(document.querySelectorAll('.identity-name .identity-letter'));
  if (!letters.length) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const symbols = '01<>[]{}#%&*+=?/';
  let timer;
  let started = 0;
  let arriving = false;
  function clear() {
    clearTimeout(timer);
    letters.forEach(letter => {
      letter.classList.remove('is-scrambling');
      letter.removeAttribute('data-glyph');
    });
  }
  function tick() {
    const elapsed = performance.now() - started;
    let pending = false;
    letters.forEach((letter, index) => {
      const begin = index < 6 ? 860 + index * 75 : 1400 + (index - 6) * 75;
      const age = elapsed - begin;
      if (age < 0) { pending = true; return; }
      if (age < 450) {
        pending = true;
        letter.classList.add('is-scrambling');
        letter.setAttribute('data-glyph', symbols[(Math.floor(age / 65) * 7 + index * 3) % symbols.length]);
      } else {
        letter.classList.remove('is-scrambling');
        letter.removeAttribute('data-glyph');
      }
    });
    if (pending) timer = setTimeout(tick, 65);
  }
  function sync() {
    const next = root.classList.contains('intro-arriving');
    if (next === arriving) return;
    arriving = next;
    clear();
    if (arriving && !motion.matches) {
      started = performance.now();
      timer = setTimeout(tick, 860);
    }
  }
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['class'] });
  motion.addEventListener('change', () => { if (motion.matches) clear(); });
  sync();
})();

// Run decorative experience animations only while visible.
(() => {
  const illustrations = document.querySelectorAll('.job-animation');
  if (!illustrations.length) return;
  const visible = new Set();
  const sync = () => illustrations.forEach(item => {
    item.classList.toggle('is-running', visible.has(item) && !document.hidden);
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      sync();
    });
    illustrations.forEach(item => observer.observe(item));
  } else {
    illustrations.forEach(item => visible.add(item));
    sync();
  }
  document.addEventListener('visibilitychange', sync);
})();

// Show the return link once the reader has moved down the page.
(() => {
  const link = document.querySelector('.back-to-top');
  if (!link) return;
  document.documentElement.classList.add('back-top-ready');
  const sync = () => link.classList.toggle('is-visible', window.scrollY > 400);
  window.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('pageshow', sync);
  sync();
})();

// Track the section at the reading position without changing the URL on scroll.
(() => {
  const dock = document.querySelector('.section-dock');
  if (!dock) return;
  const entries = Array.from(dock.querySelectorAll('a[href^="#"]')).map(link => ({
    link, section: document.getElementById(link.getAttribute('href').slice(1))
  })).filter(entry => entry.section);
  let pending = false;
  let current = null;
  function update() {
    pending = false;
    const readingLine = window.innerHeight * .33;
    let active = null;
    entries.forEach(entry => {
      if (entry.section.getBoundingClientRect().top <= readingLine) active = entry;
    });
    if (window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) active = entries[entries.length - 1];
    if (active === current) return;
    current = active;
    entries.forEach(entry => {
      if (entry === active) entry.link.setAttribute('aria-current', 'location');
      else entry.link.removeAttribute('aria-current');
    });
    if (active) {
      const linkBox = active.link.getBoundingClientRect();
      const dockBox = dock.getBoundingClientRect();
      if (linkBox.left < dockBox.left || linkBox.right > dockBox.right) {
        dock.scrollLeft += linkBox.left - dockBox.left - (dock.clientWidth - linkBox.width) / 2;
      }
    }
  }
  function schedule() {
    if (!pending) { pending = true; requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', schedule);
  document.addEventListener('portfolio:boot-end', schedule);
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(document.getElementById('main'));
  schedule();
})();

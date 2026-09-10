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
  const letters = Array.from(document.querySelectorAll('.identity-name .identity-letter:not(.identity-period)'));
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

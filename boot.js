'use strict';

(() => {
  const boot = document.getElementById('boot-screen');
  if (!boot) return;
  let running = false;
  function startBoot() {
    if (running) return;
    running = true;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const surfaces = Array.from(document.querySelectorAll('header, main, footer, .skip-link, .section-dock'));
    const output = document.getElementById('boot-output');
    const statusMessage = document.getElementById('boot-status');
    const lines = [
      { text: ':: starting portfolio', tone: 'boot-info' },
      { text: '   loading interface ...', tone: 'boot-muted' },
      { text: '   checking components ...', tone: 'boot-muted' },
      { text: 'canvas renderer ready', check: () => !!document.getElementById('curiosity-canvas')?.getContext('2d') },
      { text: 'section links verified', check: () => Array.from(document.querySelectorAll('a[href^="#"]')).every(link => {
        const target = link.getAttribute('href').slice(1);
        return !target || !!document.getElementById(target);
      }) },
      { text: ':: startup complete', tone: 'boot-info' },
      { text: '   routing to portfolio ...', tone: 'boot-route' }
    ];
    const rows = [];
    const lineInterval = 160;
    output.replaceChildren();
    function typeLines(elapsed) {
      let changed = false;
      lines.forEach((line, index) => {
        const localTime = elapsed - index * lineInterval;
        if (localTime < 0 && !reducedMotion) return;
        let entry = rows[index];
        if (!entry) {
          const row = document.createElement('span');
          row.className = `boot-line ${line.tone || ''}`;
          let prefix = '';
          let status;
          if (line.check) {
            let passed = false;
            try { passed = line.check(); } catch { /* A failed check never blocks the page. */ }
            prefix = passed ? '[PASS]' : '[FAIL]';
            status = document.createElement('span');
            status.className = passed ? 'boot-pass' : 'boot-fail';
            row.appendChild(status);
          }
          const text = document.createTextNode('');
          row.appendChild(text);
          output.appendChild(row);
          entry = rows[index] = { text, status, prefix, value: prefix ? ` ${line.text}` : line.text, count: -1 };
        }
        const count = reducedMotion || index > 0 ? Infinity : 1 + Math.floor(localTime / 12);
        const visible = (entry.prefix + entry.value).slice(0, count);
        if (entry.count === visible.length) return;
        changed = true;
        entry.count = visible.length;
        if (entry.status) entry.status.textContent = visible.slice(0, entry.prefix.length);
        entry.text.textContent = visible.slice(entry.prefix.length);
      });
      if (changed) output.scrollTop = output.scrollHeight;
    }
    typeLines(0);
    const started = performance.now();
    let finished = false;
    const timers = [];
    let deadline;
    function finish() {
      if (finished) return;
      finished = true;
      timers.forEach(clearTimeout);
      clearTimeout(deadline);
      document.removeEventListener('keydown', onKey);
      // Respect shared section links.
      let target = document.getElementById('intro');
      if (window.location.hash) {
        try {
          const requested = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
          const main = document.getElementById('main');
          if (requested && (requested === main || main.contains(requested))) target = requested;
        } catch { /* A malformed fragment falls back to the intro. */ }
      }
      function positionPage() {
        const top = target.id === 'intro' ? 0 : Math.max(0, window.scrollY + target.getBoundingClientRect().top - 32);
        window.scrollTo({ top, left: 0, behavior: 'instant' });
      }
      positionPage();
      if (!reducedMotion) document.documentElement.classList.add('intro-arriving');
      boot.classList.add('boot-finished');
      // A hard deadline keeps this cosmetic introduction from ever blocking the site.
      setTimeout(() => {
        boot.hidden = true;
        surfaces.forEach(surface => { surface.inert = false; });
        document.documentElement.classList.remove('is-booting');
        const destination = target.querySelector('h1, h2') || target;
        const previousTabindex = destination.getAttribute('tabindex');
        destination.setAttribute('tabindex', '-1');
        destination.classList.add('boot-focus-target');
        destination.addEventListener('blur', () => {
          destination.classList.remove('boot-focus-target');
          if (previousTabindex === null) destination.removeAttribute('tabindex');
          else destination.setAttribute('tabindex', previousTabindex);
        }, { once: true });
        destination.focus({ preventScroll: true });
        positionPage();
        statusMessage.textContent = 'Portfolio ready.';
        document.dispatchEvent(new Event('portfolio:boot-end'));
        running = false;
      }, reducedMotion ? 0 : 180);
    }
    function onKey(event) {
      if (event.key === 'Escape') finish();
      if (event.key === 'Tab') { event.preventDefault(); boot.focus({ preventScroll: true }); }
    }
    document.documentElement.classList.remove('intro-arriving');
    boot.classList.remove('boot-finished');
    boot.hidden = false;
    surfaces.forEach(surface => { surface.inert = true; });
    document.documentElement.classList.add('is-booting');
    document.dispatchEvent(new Event('portfolio:boot-start'));
    statusMessage.textContent = 'Starting portfolio. Please wait briefly, or press Escape to continue.';
    boot.focus({ preventScroll: true });
    document.addEventListener('keydown', onKey);
    // Only the first line needs rapid updates; execution output uses one timer per line.
    if (!reducedMotion) {
      function typeFirstLine() {
        const elapsed = performance.now() - started;
        typeLines(elapsed);
        if (elapsed < (lines[0].text.length - 1) * 12) timers.push(setTimeout(typeFirstLine, 24));
      }
      timers.push(setTimeout(typeFirstLine, 24));
      lines.slice(1).forEach((line, index) => {
        timers.push(setTimeout(() => typeLines(performance.now() - started), (index + 1) * lineInterval));
      });
    }
    deadline = setTimeout(finish, 1400);
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try {
    if (sessionStorage.getItem('portfolio-boot-shown') === '1') {
      document.documentElement.classList.add('intro-arriving');
      return;
    }
    sessionStorage.setItem('portfolio-boot-shown', '1');
  } catch {
    document.documentElement.classList.add('intro-arriving');
    return;
  }
  startBoot();
})();

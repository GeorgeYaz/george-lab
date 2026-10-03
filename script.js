'use strict';
document.getElementById('year').textContent = String(new Date().getFullYear());

// Keep copying separate from opening the visitor's email application.
(() => {
  const button = document.getElementById('copy-email');
  const link = document.querySelector('.contact-email-link');
  const status = document.getElementById('copy-email-status');
  if (!button || !link || !status) return;
  const label = button.querySelector('span');
  let resetTimer;
  button.hidden = false;
  button.addEventListener('click', async () => {
    clearTimeout(resetTimer);
    button.disabled = true;
    status.textContent = '';
    try {
      await navigator.clipboard.writeText(link.getAttribute('href').slice('mailto:'.length));
      label.textContent = 'Copied';
      button.classList.add('is-copied');
      status.textContent = 'Email address copied.';
    } catch {
      label.textContent = 'Retry';
      button.title = 'Could not copy. Please select and copy the email address.';
      button.classList.remove('is-copied');
      status.textContent = 'Could not copy. Please select and copy the email address above.';
    } finally {
      button.disabled = false;
      resetTimer = setTimeout(() => {
        label.textContent = 'Copy';
        button.removeAttribute('title');
        button.classList.remove('is-copied');
        status.textContent = '';
      }, 5000);
    }
  });
})();


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
  let destination = null;
  const pill = document.createElement('span');
  pill.className = 'section-dock-pill';
  pill.setAttribute('aria-hidden', 'true');
  dock.appendChild(pill);
  dock.classList.add('has-sliding-pill');
  function update() {
    pending = false;
    const readingLine = window.innerHeight * .33;
    let active = null;
    entries.forEach(entry => {
      if (entry.section.getBoundingClientRect().top <= readingLine) active = entry;
    });
    if (window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) active = entries[entries.length - 1];
    if (destination) active = destination;
    entries.forEach(entry => {
      if (entry === active) entry.link.setAttribute('aria-current', 'location');
      else entry.link.removeAttribute('aria-current');
    });
    if (active) {
      pill.style.width = `${active.link.offsetWidth}px`;
      pill.style.height = `${active.link.offsetHeight}px`;
      pill.style.top = `${active.link.offsetTop}px`;
      pill.style.transform = `translateX(${active.link.offsetLeft}px)`;
      pill.classList.add('is-visible');
      const linkBox = active.link.getBoundingClientRect();
      const dockBox = dock.getBoundingClientRect();
      if (linkBox.left < dockBox.left || linkBox.right > dockBox.right) {
        dock.scrollLeft += linkBox.left - dockBox.left - (dock.clientWidth - linkBox.width) / 2;
      }
    } else pill.classList.remove('is-visible');
  }
  function schedule() {
    if (!pending) { pending = true; requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', schedule);
  document.addEventListener('portfolio:boot-end', schedule);
  document.addEventListener('portfolio:travel-start', event => {
    destination = entries.find(entry => entry.section.id === event.detail.id) || null;
    schedule();
  });
  document.addEventListener('portfolio:travel-end', () => {
    destination = null;
    schedule();
  });
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(document.getElementById('main'));
  schedule();
})();

// Reveal the illustration first, then uncover the description without shifting the page.
(() => {
 const section = document.getElementById('projects');
 if (!section) return;
 const cards = Array.from(section.querySelectorAll('.project'));
 const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
 const timers = new Map();
 let observer;
 function finish(card) {
   clearTimeout(timers.get(card));
   timers.delete(card);
   card.classList.remove('project-reveal-ready');
   card.querySelector('.project-content').inert = false;
 }
 function reveal(card) {
   if (card.classList.contains('is-revealed')) return;
   card.classList.add('is-revealed');
   if (observer) observer.unobserve(card);
   timers.set(card, setTimeout(() => finish(card), 1200));
 }
 if (!motion.matches && 'IntersectionObserver' in window) {
   observer = new IntersectionObserver(entries => {
     entries.forEach(entry => { if (entry.isIntersecting) reveal(entry.target); });
   }, { rootMargin: '0px 0px -10% 0px', threshold: .05 });
   cards.forEach(card => {
     if (card.getBoundingClientRect().bottom < 0) return;
       card.classList.add('project-reveal-ready');
     card.querySelector('.project-content').inert = true;
     observer.observe(card);
   });
   motion.addEventListener('change', () => {
     if (!motion.matches) return;
     observer.disconnect();
     cards.forEach(finish);
   });
 }
 const illustrations = Array.from(section.querySelectorAll('.quadcopter, .smart-room, .parking-system, .stealth-visual'));
 const visible = new Set();
 const playback = () => illustrations.forEach(item => item.classList.toggle('is-running', visible.has(item) && !document.hidden));
 if ('IntersectionObserver' in window) {
   const animationObserver = new IntersectionObserver(entries => {
     entries.forEach(entry => {
       if (entry.isIntersecting) visible.add(entry.target);
       else visible.delete(entry.target);
     });
     playback();
   });
   illustrations.forEach(item => animationObserver.observe(item));
 } else { illustrations.forEach(item => visible.add(item)); playback(); }
 document.addEventListener('visibilitychange', playback);
})();

// Deliberate section-link travel; wheel and touch scrolling remain native.
(() => {
 const root = document.documentElement;
 const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
 let frame = 0;
 function cancel() {
   cancelAnimationFrame(frame);
   frame = 0;
   const wasTravelling = root.classList.contains('section-travelling');
   root.classList.remove('section-travelling');
   if (wasTravelling) document.dispatchEvent(new Event('portfolio:travel-end'));
 }
 document.addEventListener('click', event => {
   const link = event.target.closest('a[href^="#"]');
   if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || motion.matches) return;
   let target;
   try { target = document.getElementById(decodeURIComponent(link.hash.slice(1))); } catch { return; }
   if (!target) return;
   event.preventDefault();
   cancel();
   const start = window.scrollY;
   const top = target.id === 'top' || target.id === 'intro' ? 0 : start + target.getBoundingClientRect().top - 32;
   const end = Math.max(0, Math.min(top, root.scrollHeight - window.innerHeight));
   const distance = end - start;
   const duration = Math.min(1400, Math.max(650, Math.abs(distance) * .3));
   if (location.hash !== link.hash) history.pushState(null, '', link.hash);
   root.classList.add('section-travelling');
   document.dispatchEvent(new CustomEvent('portfolio:travel-start', {detail:{id:target.id}}));
   const began = performance.now();
   function tick(now) {
     const progress = Math.min(1, (now - began) / duration);
     const eased = progress * progress * (3 - 2 * progress);
     window.scrollTo({top:start + distance * eased, behavior:'auto'});
     if (progress < 1) { frame = requestAnimationFrame(tick); return; }
     cancel();
     const destination = target.querySelector('h1, h2') || target;
     const previous = destination.getAttribute('tabindex');
     destination.setAttribute('tabindex', '-1');
     destination.classList.add('boot-focus-target');
     destination.focus({preventScroll:true});
     destination.addEventListener('blur', () => {
       destination.classList.remove('boot-focus-target');
       if (previous === null) destination.removeAttribute('tabindex');
       else destination.setAttribute('tabindex', previous);
     }, {once:true});
   }
   frame = requestAnimationFrame(tick);
 });
 ['wheel','touchstart','pointerdown'].forEach(type => window.addEventListener(type,cancel,{passive:true}));
 window.addEventListener('keydown',event => {
   if (['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' ','Escape','Tab'].includes(event.key)) cancel();
 });
 window.addEventListener('popstate',cancel);
 window.addEventListener('resize',cancel,{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden) cancel();});
 motion.addEventListener('change',cancel);
})();

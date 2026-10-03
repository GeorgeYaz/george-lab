'use strict';

(() => {
  const main = document.getElementById('main');
  const svg = document.getElementById('scroll-circuit');
  if (!main || !svg) return;
  const sections = Array.from(main.querySelectorAll(':scope > section'));
  const track = document.getElementById('circuit-track');
  const light = document.getElementById('circuit-light');
  const glow = document.getElementById('circuit-glow');
  const tip = document.getElementById('circuit-tip');
  const halo = document.getElementById('circuit-halo');
  let points = [];
  let mainTop = 0;
  let pending = false;
  let easedPosition = null;
  let lastFrame = 0;
  let layoutDirty = true;
  const namespace = 'http://www.w3.org/2000/svg';
  // Decorative schematic components sit in the whitespace below section dividers.
  const branchShapes = [
    { d: 'M0 0 V17 H15 L19 12 L25 22 L31 12 L37 22 L43 12 L49 22 L53 17 H76 V31 M66 31 H86 M70 36 H82 M74 41 H78' },
    { d: 'M0 0 V17 H24 M24 9 V25 M31 9 V25 M31 17 H61 V29 M51 29 H71 M55 34 H67 M59 39 H63' },
    { d: 'M0 0 V5 H50 V13 M28 13 H72 V41 H28 Z M20 20 H28 M20 28 H28 M20 36 H28 M72 20 H80 M72 28 H80 M72 36 H80 M50 41 V48 M40 48 H60 M44 53 H56 M48 58 H52 M50 5 H92 V18 M86 18 H98 M86 24 H98 M92 24 V48 H50', label: 'MCU', x: 32, y: 10 },
    { d: 'M0 0 V22 H10 L14 17 L20 27 L26 17 L32 27 L36 22 H47 M47 12 L63 22 L47 32 Z M63 12 V32 M63 22 H96 V38 M86 38 H106 M90 43 H102 M94 48 H98 M59 9 L67 1 M63 1 H67 V5 M68 14 L76 6 M72 6 H76 V10' },
  ];
  function createSymbol({ d, label, x, y }) {
    const group = document.createElementNS(namespace, 'g');
    const base = document.createElementNS(namespace, 'path');
    base.setAttribute('d', d);
    base.setAttribute('class', 'circuit-branch-track');
    const live = document.createElementNS(namespace, 'g');
    live.setAttribute('opacity', '0');
    for (const className of ['circuit-branch-glow', 'circuit-branch-light']) {
      const path = document.createElementNS(namespace, 'path');
      path.setAttribute('d', d);
      path.setAttribute('class', className);
      live.appendChild(path);
    }
    // A small filled junction makes the offshoot's connection unambiguous.
    const junction = document.createElementNS(namespace, 'circle');
    junction.setAttribute('r', '2');
    junction.setAttribute('class', 'circuit-branch-junction');
    live.appendChild(junction);
    if (label) {
      const text = document.createElementNS(namespace, 'text');
      text.textContent = label;
      text.setAttribute('x', x);
      text.setAttribute('y', y);
      text.setAttribute('class', 'circuit-component-label');
      live.appendChild(text);
    }
    group.appendChild(base);
    group.appendChild(live);
    svg.appendChild(group);
    return { group, live, at: 0 };
  }
  const branches = branchShapes.map(createSymbol);
  const mainSwitch = createSymbol({ d: 'M-2 0 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0 M-2 30 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0' });
  mainSwitch.group.setAttribute('class', 'circuit-main-switch');
  const switchArms = ['circuit-branch-track', 'circuit-branch-light'].map((className, index) => {
    const arm = document.createElementNS(namespace, 'path');
    arm.setAttribute('class', className);
    (index === 0 ? mainSwitch.group : mainSwitch.live).appendChild(arm);
    return arm;
  });
  const contact = document.getElementById('contact');
  const portrait = contact && contact.querySelector('.contact-portrait');
  let portraitRevealPlayed = false;
  if (portrait) portrait.addEventListener('animationend', event => {
    if (event.animationName === 'portrait-border-pass') portrait.classList.remove('is-tracing');
  });
  const supply = createSymbol({
    d: 'M0 0 V-14 M0 -14 a10 10 0 1 0 0 -20 a10 10 0 1 0 0 20 M-3 -20 H3 M0 -23 V-17 M-3 -28 H3 M0 -34 V-42 H40 V-20 M32 -20 H48 M36 -16 H44 M39 -12 H41',
    label: 'DC', x: 15, y: -9
  });
  // The final segment is a connection metaphor, ending at George rather than ground.
  const endpoint = createSymbol({ d: 'M0 -2 a2 2 0 1 0 0 4 a2 2 0 1 0 0 -4' });
  const binary = document.createElementNS(namespace, 'text');
  binary.setAttribute('x', '32');
  binary.setAttribute('y', '26');
  binary.setAttribute('class', 'circuit-mcu-binary');
  binary.textContent = '010101';
  branches[2].live.appendChild(binary);
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sectionLabels = sections.map(section => {
    const eyebrow = section.querySelector('.eyebrow');
    const match = eyebrow && eyebrow.textContent.match(/^(\d{2})\s*\/\s*(.+)$/);
    if (!match) return null;
    const number = document.createElement('span');
    number.className = 'section-number'; number.textContent = match[1];
    number.setAttribute('aria-hidden', 'true');
    const separator = document.createElement('span');
    separator.textContent = '/'; separator.setAttribute('aria-hidden', 'true');
    const caption = document.createElement('span'); caption.className = 'section-caption';
    caption.setAttribute('aria-hidden', 'true');
    const ghost = document.createElement('span'); ghost.className = 'section-caption-layout'; ghost.textContent = match[2];
    const typed = document.createElement('span'); typed.className = 'section-caption-typed';
    caption.appendChild(ghost); caption.appendChild(typed);
    const accessible = document.createElement('span'); accessible.className = 'sr-only'; accessible.textContent = eyebrow.textContent;
    eyebrow.replaceChildren(accessible, number, separator, caption);
    eyebrow.classList.add('circuit-section-label');
    return { section, eyebrow, typed, text: match[2], active: false, started: 0, at: 0 };
  }).filter(Boolean);
  function updateSectionLabels(position, now) {
    let typing = false;
    sectionLabels.forEach(label => {
      const active = position >= label.at;
      if (active !== label.active) {
        label.active = active;
        label.started = now;
        label.eyebrow.classList.toggle('is-powered', active);
      }
      const count = active ? (motion.matches ? label.text.length : Math.floor((now - label.started) / 28)) : 0;
      const value = label.text.slice(0, count);
      if (label.typed.textContent !== value) label.typed.textContent = value;
      if (active && count < label.text.length) typing = true;
    });
    return typing;
  }
  let mcuActive = false;
  let binaryTimer = null;
  let binaryStep = 0;
  function updateBinaryPlayback() {
    if (mcuActive && !document.hidden && !motion.matches) {
      if (binaryTimer === null) binaryTimer = setInterval(() => {
        binaryStep = (binaryStep + 1) % 64;
        binary.textContent = (binaryStep ^ 21).toString(2).padStart(6, '0');
      }, 650);
    } else if (binaryTimer !== null) {
      clearInterval(binaryTimer);
      binaryTimer = null;
    }
  }
  document.addEventListener('visibilitychange', updateBinaryPlayback);
  motion.addEventListener('change', updateBinaryPlayback);

  function pathFrom(vertices) {
    return vertices.map((p, i) => `${i && !p.move ? 'L' : 'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  }
  function measure() {
    const rect = main.getBoundingClientRect();
    mainTop = rect.top + window.scrollY;
    const bounds = sections.map(section => section.getBoundingClientRect());
    // Move inward by about 1 CSS cm (38px), while retaining safe content clearance.
    const outerSpace = Math.min(
      ...bounds.map(bound => bound.left - rect.left),
      ...bounds.map(bound => rect.width - (bound.right - rect.left))
    );
    const inset = Math.max(12, Math.min(50, outerSpace - 48));
    const left = inset;
    const right = rect.width - inset;
    const corner = 12;
    let side = left;
    const startY = 136;
    points = [{ x: side, y: startY, at: startY }];
    supply.group.setAttribute('transform', `translate(${left} ${startY}) scale(.8)`);
    bounds.slice(1).forEach((section, index) => {
      const y = section.top - rect.top - 24;
      if (index === bounds.length - 2) {
        // Position the final switch relative to the heading after measuring it below.
        return;
      }
      const nextSide = side === left ? right : left;
      const direction = side === left ? 1 : -1;
      // Route through the space between sections, with a shallow PCB-style step.
      const startX = side + direction * corner;
      const finishX = nextSide - direction * corner;
      const across = fraction => startX + (finishX - startX) * fraction;
      points.push(
        { x: side, y: y - corner, at: y - 40 },
        { x: startX, y, at: y - 28 },
        { x: across(.42), y, at: y - 28 + .42 * 56 },
        { x: across(.46), y: y - 12, at: y - 28 + .46 * 56 },
        { x: across(.58), y: y - 12, at: y - 28 + .58 * 56 },
        { x: across(.62), y, at: y - 28 + .62 * 56 },
        { x: finishX, y, at: y + 28 },
        { x: nextSide, y: y + corner, at: y + 40 }
      );
      if (branches[index]) {
        const branch = branches[index];
        const fraction = index === 2 ? .64 : .3;
        const x = across(fraction);
        const symbolScale = rect.width < 600 ? .8 : 1;
        branch.group.setAttribute('transform', `translate(${x} ${y}) scale(${symbolScale})`);
        branch.at = y - 28 + fraction * 56;
      }
      side = nextSide;
    });
    const headingRect = document.getElementById('contact-title').getBoundingClientRect();
    const endY = headingRect.top - rect.top + headingRect.height / 2;
    const endX = Math.max(side + 6, headingRect.left - rect.left - 9);
    endpoint.at = endY + 14;
    // Keep a short vertical connection between the closed switch and the heading,
    // independent of contact-section padding or desktop grid height.
    mainSwitch.at = endY - 64;
    mainSwitch.group.setAttribute('transform', `translate(${side} ${mainSwitch.at})`);
    points.push({ x: side, y: mainSwitch.at, at: mainSwitch.at },
      { x: side, y: mainSwitch.at + 30, at: mainSwitch.at + 30, move: true });
    points.push({ x: side, y: endY - corner, at: endY - 24 },
      { x: side + corner, y: endY, at: endY - 12 },
      { x: endX, y: endY, at: endpoint.at });
    endpoint.group.setAttribute('transform', `translate(${endX} ${endY})`);
    sectionLabels.forEach(label => {
      const index = sections.indexOf(label.section);
      label.at = label.section === contact ? endpoint.at : bounds[index].top - rect.top;
    });
    svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
    track.setAttribute('d', pathFrom(points));
    layoutDirty = false;
  }
  function render(now = performance.now()) {
    pending = false;
    const resetPosition = layoutDirty;
    if (layoutDirty) measure();
    const pageBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    const targetPosition = pageBottom ? points[points.length - 1].at
      : window.scrollY + window.innerHeight * .55 - mainTop;
    // Time-based easing is consistent across 60/120Hz displays and stops at rest.
    const dt = Math.min(32, Math.max(1, now - lastFrame || 16));
    lastFrame = now;
    if (resetPosition || easedPosition === null || motion.matches || document.hidden) easedPosition = targetPosition;
    else easedPosition += (targetPosition - easedPosition) * (1 - Math.exp(-dt / 90));
    const catchingUp = Math.abs(targetPosition - easedPosition) > .5;
    if (!catchingUp) easedPosition = targetPosition;
    const position = easedPosition;
    const visible = [points[0]];
    let end = points[0];
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i];
      if (position >= b.at) { visible.push(b); end = b; continue; }
      const fraction = Math.max(0, Math.min((position - a.at) / (b.at - a.at), 1));
      end = { x: a.x + (b.x - a.x) * fraction, y: a.y + (b.y - a.y) * fraction, move: b.move };
      visible.push(end);
      break;
    }
    const d = pathFrom(visible);
    light.setAttribute('d', d);
    glow.setAttribute('d', d);
    supply.live.setAttribute('opacity', '1');
    const switchProgress = Math.max(0, Math.min((position - mainSwitch.at) / 30, 1));
    const switchEase = switchProgress * switchProgress * (3 - 2 * switchProgress);
    const angle = (1 - switchEase) * Math.PI / 6;
    switchArms.forEach(arm => arm.setAttribute('d', `M0 0 L${Math.sin(angle) * 30} ${Math.cos(angle) * 30}`));
    mainSwitch.live.setAttribute('opacity', String(.25 + .75 * switchEase));
    if (contact) {
      const connected = position >= endpoint.at;
      if (portrait && connected && !portraitRevealPlayed) {
        portraitRevealPlayed = true;
        if (!motion.matches) portrait.classList.add('is-tracing');
      }
      contact.classList.toggle('is-connected', connected);
    }
    const endpointProgress = Math.max(0, Math.min((position - endpoint.at + 32) / 32, 1));
    endpoint.live.setAttribute('opacity', String(endpointProgress));
    branches.forEach(branch => {
      const progress = Math.max(0, Math.min((position - branch.at) / 48, 1));
      branch.live.setAttribute('opacity', String(progress * progress * (3 - 2 * progress)));
    });
    const stillTyping = updateSectionLabels(position, now);
    if (stillTyping || (catchingUp && !document.hidden)) schedule();
    const mcuY = mainTop + branches[2].at - window.scrollY;
    mcuActive = position > branches[2].at && mcuY > -60 && mcuY < window.innerHeight;
    updateBinaryPlayback();
    for (const marker of [tip, halo]) {
      marker.setAttribute('cx', end.x);
      marker.setAttribute('cy', end.y);
    }
  }
  function schedule() {
    if (!pending) { pending = true; requestAnimationFrame(render); }
  }
  function refresh() { layoutDirty = true; schedule(); }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', refresh, { passive: true });
  window.addEventListener('load', refresh);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(refresh);
    observer.observe(main);
    sections.forEach(section => observer.observe(section));
  }
  svg.removeAttribute('hidden');
  document.documentElement.classList.add('circuit-ready');
  schedule();
})();

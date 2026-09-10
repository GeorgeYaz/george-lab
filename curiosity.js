'use strict';

// A conceptual atom-to-graph diagram. All drawing stays local and dependency-free.
(() => {
  const canvas = document.getElementById('curiosity-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const phaseLabel = document.getElementById('curiosity-phase');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const graph = [[90,85],[210,62],[343,92],[160,157],[300,164],[117,285],[365,253],[220,208]];
  const coreNode = graph.length - 1;
  const edges = [[0,1],[1,2],[1,3],[2,4],[3,4],[3,5],[3,7],[4,7],[5,7],[4,6]];
  const turns = [0, Math.PI / 3, -Math.PI / 3];
  let frame;
  let visible = true;
  let elapsed = 0;
  let lastTime = null;
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let ratio = 1;

  function smooth(t) { return t * t * (3 - 2 * t); }
  // Every phase starts its animation and console typing together.
  function orbitPoint(index, seconds) {
    const rotation = turns[Math.floor(index / 3)];
    const angle = seconds * .5 + (index % 3) * Math.PI * 2 / 3 + Math.floor(index / 3) * .6;
    const x = 136 * Math.cos(angle);
    const y = 48 * Math.sin(angle);
    return [220 + x * Math.cos(rotation) - y * Math.sin(rotation),
      180 + x * Math.sin(rotation) + y * Math.cos(rotation)];
  }
  const codeLines = [
    '// eight bits -> one letter',
    '// 01000010 01010101 01001001',
    '// 01001100 01000100',
    'const ideas = new Graph();',
    'const question = explore();',
    'for (const insight of observe()) {',
    '  ideas.connect(question, insight);',
    '  test(insight);',
    '}',
    'const force = mass * acceleration;',
    'const energy = mass * c ** 2;',
    '',
    'const knowledge = ideas.resolve();',
    'build(knowledge);',
    '// keep asking questions...'
  ];
  const codeLength = codeLines.reduce((total, line) => total + line.length + 1, 0);
  const coloredCode = codeLines.map(line => {
    const tokens = line.match(/\/\/.*|\b(?:const|new|for|of)\b|\b\d+\b|\b[A-Za-z_]\w*(?=\s*\()|./g) || [];
    return tokens.map(text => ({
      text,
      color: text.startsWith('//') ? '#9ab8a7'
        : /^(const|new|for|of)$/.test(text) ? '#c9a4ef'
        : /^\d+$/.test(text) ? '#edbd83'
        : /^[A-Za-z_]\w+$/.test(text) ? '#87cbe4' : '#dddddd'
    }));
  });
  function backgroundCode(amount, phase, still) {
    if (amount <= 0) return;
    let remaining = still ? codeLength : Math.floor(Math.max(0, Math.min((phase - 8) / 3, 1)) * codeLength);
    ctx.globalAlpha = amount * .65;
    ctx.fillStyle = '#dddddd';
    ctx.font = '14px Consolas, monospace';
    for (let i = 0; i < codeLines.length && remaining > 0; i++) {
      const line = codeLines[i];
      const visible = line.slice(0, remaining);
      let x = 45;
      let characters = visible.length;
      for (const token of coloredCode[i]) {
        if (characters <= 0) break;
        const fragment = token.text.slice(0, characters);
        ctx.fillStyle = token.color;
        ctx.fillText(fragment, x, 49 + i * 19);
        x += ctx.measureText(fragment).width;
        characters -= fragment.length;
      }
      if (!still && remaining <= line.length) {
        ctx.fillStyle = '#dddddd';
        ctx.fillRect(45 + ctx.measureText(visible).width + 2, 41 + i * 19, 5, 10);
      }
      remaining -= line.length + 1;
    }
    ctx.globalAlpha = 1;
  }
  const feedbackPath = [[287,228],[237,228],[237,187],[164,187],[164,179],[157,179]];
  const feedbackLengths = feedbackPath.slice(1).map((point, index) =>
    Math.hypot(point[0] - feedbackPath[index][0], point[1] - feedbackPath[index][1]));
  const feedbackLength = feedbackLengths.reduce((sum, length) => sum + length, 0);
  // A conceptual mechatronic control loop: firmware, actuator, and sensor feedback.
  function drawProduct(amount, seconds) {
    if (amount <= 0) return;
    ctx.save();
    ctx.globalAlpha = amount;
    ctx.fillStyle = '#141414'; ctx.fillRect(70,98,300,184);
    ctx.strokeStyle = '#777777'; ctx.strokeRect(70,98,300,184);
    ctx.font = '13px Consolas, monospace'; ctx.fillStyle = '#cfcfcf';
    ctx.fillText('System', 83,117);
    ctx.strokeStyle = '#424242'; ctx.beginPath(); ctx.moveTo(70,127); ctx.lineTo(370,127); ctx.stroke();
    const details = smooth(Math.max(0, Math.min((amount - .15) / .85, 1)));
    ctx.globalAlpha = amount * details;

    // Microcontroller package, pins, and a small firmware readout.
    ctx.strokeStyle = '#bcbcbc'; ctx.strokeRect(106,147,44,38);
    for (let i = 0; i < 5; i++) {
      const y = 151 + i * 7;
      ctx.beginPath(); ctx.moveTo(99,y); ctx.lineTo(106,y); ctx.moveTo(150,y); ctx.lineTo(157,y); ctx.stroke();
    }
    ctx.fillStyle = '#dedede'; ctx.fillText('MCU',119,170);
    ctx.fillStyle = '#999999'; ctx.fillText('FIRMWARE', 94,141);
    ctx.strokeStyle = '#454545'; ctx.strokeRect(87,207,122,54);
    ctx.fillStyle = '#bcbcbc'; ctx.fillText('> control.loop()', 95,222);
    ctx.strokeStyle = '#bcbcbc'; ctx.beginPath();
    for (let i = 0; i <= 95; i++) {
      const x = 97 + i, y = 246 - Math.sin(i * .16 - seconds * 2) * 5;
      if (i === 0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke();

    // A motor symbol with a moving shaft, not another software window.
    ctx.strokeStyle = '#d3d3d3'; ctx.beginPath(); ctx.arc(304,167,25,0,Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(304,167,18,0,Math.PI * 2); ctx.stroke();
    const angle = seconds * 1.2;
    ctx.beginPath(); ctx.moveTo(304 - Math.cos(angle)*14,167 - Math.sin(angle)*14);
    ctx.lineTo(304 + Math.cos(angle)*14,167 + Math.sin(angle)*14); ctx.stroke();
    ctx.fillStyle = '#df6262'; ctx.beginPath(); ctx.arc(304,167,3,0,Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#bcbcbc'; ctx.fillText('ACTUATOR', 280,137);

    // Command trace and returning sensor signal express software acting on hardware.
    ctx.strokeStyle = '#a0a0a0'; ctx.beginPath();
    ctx.moveTo(157,165); ctx.lineTo(279,165);
    ctx.moveTo(270,161); ctx.lineTo(279,165); ctx.lineTo(270,169);
    ctx.moveTo(304,192); ctx.lineTo(304,218); ctx.stroke();
    ctx.strokeRect(287,218,34,20);
    ctx.beginPath(); ctx.moveTo(292,228); ctx.lineTo(298,228); ctx.lineTo(302,223); ctx.lineTo(307,233); ctx.lineTo(311,228); ctx.lineTo(316,228); ctx.stroke();
    ctx.fillStyle = '#999999'; ctx.fillText('SENSOR', 286,254);
    ctx.strokeStyle = '#777777'; ctx.beginPath();
    ctx.moveTo(...feedbackPath[0]);
    feedbackPath.slice(1).forEach(point => ctx.lineTo(...point));
    ctx.moveTo(162,175); ctx.lineTo(157,179); ctx.lineTo(162,183); ctx.stroke();
    ctx.fillStyle = '#999999'; ctx.fillText('SIGNAL', 196,156);
    ctx.fillStyle = '#df6262';
    const signalProgress = (seconds * .6) % 1;
    ctx.beginPath(); ctx.arc(164 + signalProgress * 105,165,2,0,Math.PI * 2); ctx.fill();
    let remaining = signalProgress * feedbackLength;
    for (let i = 0; i < feedbackLengths.length; i++) {
      const length = feedbackLengths[i];
      if (remaining > length) { remaining -= length; continue; }
      const [x, y] = feedbackPath[i];
      const [nextX, nextY] = feedbackPath[i + 1];
      const fraction = remaining / length;
      ctx.beginPath();
      ctx.arc(x + (nextX - x) * fraction, y + (nextY - y) * fraction, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    ctx.restore();
  }
  function drawBinary(seconds, still, blend) {
    const bits = '0100101101101110011011110111011101101100011001010110010001100111';
    const offset = still ? 0 : Math.floor(seconds * 3) % bits.length;
    ctx.font = '14px Consolas, monospace';
    ctx.fillStyle = '#bcbcbc';
    ctx.globalAlpha = .09 + blend * .07;
    ctx.fillText((bits + bits).slice(offset, offset + 48), 46,22);
    ctx.fillText((bits + bits).slice(63 - offset, 111 - offset), 46,348);
    ctx.globalAlpha = 1;
  }
  function draw(seconds, still = false) {
    const stage = still ? 2 : Math.floor((seconds % 18) / 6);
    const stageTime = still ? 6 : seconds % 6;
    const command = ['explore()', 'connect()', 'build()'][stage];
    const characters = still ? command.length : Math.floor(stageTime / .085);
    const label = `> ${command.slice(0, characters)}`;
    if (phaseLabel.textContent !== label) phaseLabel.textContent = label;
    const transition = smooth(Math.max(0, Math.min(stageTime / 2, 1)));
    const firstExplore = seconds < 6 && !still;
    const blend = stage === 0 ? (firstExplore ? 0 : 1 - transition) : stage === 1 ? transition : 1;
    const building = stage === 2 ? transition : stage === 0 && !firstExplore ? 1 - transition : 0;
    const product = still ? 1 : stage === 2
      ? smooth(Math.max(0, Math.min((stageTime - 3.75) / 1.25, 1))) * building : building;
    // One continuous clock across all phases: typing never pauses the illustration.
    const visualSeconds = still ? 0 : seconds;
    const codePhase = stage === 2 ? 8 + stageTime : 11;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(ratio * scale, 0, 0, ratio * scale, ratio * offsetX, ratio * offsetY);
    ctx.lineWidth = 1;
    drawBinary(visualSeconds, still, blend);
    backgroundCode(building, codePhase, still);

    // Fine calibration marks frame the drawing without competing with it.
    ctx.strokeStyle = '#454545';
    for (const [x,y,sx,sy] of [[32,30,1,1],[408,30,-1,1],[32,330,1,-1],[408,330,-1,-1]]) {
      ctx.beginPath(); ctx.moveTo(x + sx * 10, y); ctx.lineTo(x,y); ctx.lineTo(x,y + sy * 10); ctx.stroke();
    }
    if (blend < 1) {
      ctx.globalAlpha = (1 - blend) * .65;
      ctx.strokeStyle = '#acacac';
      turns.forEach(rotation => {
        ctx.beginPath(); ctx.ellipse(220,180,136,48,rotation,0,Math.PI * 2); ctx.stroke();
      });
    }
    const points = graph.map((target, index) => {
      const atom = index === coreNode ? [220,180] : orbitPoint(index, visualSeconds);
      return [atom[0] + (target[0] - atom[0]) * blend, atom[1] + (target[1] - atom[1]) * blend];
    });
    const graphFade = stage === 2 ? smooth(Math.max(0, Math.min(stageTime / 1.2, 1))) : building;
    const graphAlpha = 1 - graphFade * .96;
    ctx.globalAlpha = blend * .7 * graphAlpha;
    ctx.strokeStyle = '#b5b5b5';
    edges.forEach(([a,b]) => {
      ctx.beginPath(); ctx.moveTo(...points[a]); ctx.lineTo(...points[b]); ctx.stroke();
    });
    // The same particles become the graph nodes, preserving the visual connection.
    ctx.globalAlpha = 1;
    points.forEach(([x,y], index) => {
      ctx.globalAlpha = graphAlpha;
      const radius = index === coreNode ? 8 : 3.5 + blend * 2;
      ctx.beginPath(); ctx.arc(x,y,radius + 4,0,Math.PI * 2);
      ctx.fillStyle = '#111111'; ctx.fill();
      ctx.beginPath(); ctx.arc(x,y,radius,0,Math.PI * 2);
      ctx.fillStyle = index === coreNode ? '#eeeeee' : '#c7c7c7'; ctx.fill();
      if (blend > 0) {
        ctx.globalAlpha = blend * .6 * graphAlpha * smooth(Math.min(blend / .3, 1));
        ctx.strokeStyle = '#c7c7c7'; ctx.beginPath(); ctx.arc(x,y,radius + 4,0,Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (!still && stage === 1 && [3,4,coreNode].includes(index)) {
        const pulse = (seconds * .8 + index * .23) % 1;
        const fadeOut = 1 - smooth(Math.max(0, Math.min((stageTime - 5.4) / .6, 1)));
        ctx.globalAlpha = transition * fadeOut * (1 - pulse) * .8;
        ctx.strokeStyle = '#df6262';
        ctx.beginPath(); ctx.arc(x,y,radius + 5 + pulse * 18,0,Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });
    drawProduct(product, visualSeconds);
    ctx.globalAlpha = 1;

  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    scale = Math.min(rect.width / 440, rect.height / 360);
    offsetX = (rect.width - 440 * scale) / 2;
    offsetY = (rect.height - 360 * scale) / 2;
    draw(elapsed / 1000, motion.matches);
  }
  function tick(now) {
    if (lastTime !== null) elapsed += now - lastTime;
    lastTime = now;
    // Draw on each display frame; time-threshold skipping caused uneven frame spacing.
    draw(elapsed / 1000);
    frame = requestAnimationFrame(tick);
  }
  function syncPlayback() {
    cancelAnimationFrame(frame);
    lastTime = null;
    if (document.documentElement.classList.contains('is-booting')) return;
    if (motion.matches) { draw(elapsed / 1000, true); return; }
    if (visible && !document.hidden) frame = requestAnimationFrame(tick);
  }
  resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      syncPlayback();
    }, { threshold: 0 }).observe(canvas);
  }
  document.addEventListener('portfolio:boot-start', () => {
    elapsed = 0;
    syncPlayback();
  });
  document.addEventListener('portfolio:boot-end', syncPlayback);
  document.addEventListener('visibilitychange', syncPlayback);
  motion.addEventListener('change', syncPlayback);
  syncPlayback();
})();

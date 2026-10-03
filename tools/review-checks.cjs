// Regression checks for the boot handoff, scheduler, and canvas playback.
'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.resolve(__dirname, '..');
function setup({ hash = '', seen = false, reduced = false, storageFails = false } = {}) {
  let now = 0, timerId = 0, callbacks = 0, scrollReads = 0;
  const timers = new Map(), events = new Map(), ids = {};
  const win = { scrollY: 700, location: { hash }, matchMedia: () => ({ matches: reduced }) };
  function element(id = '') {
    const classes = new Set(), attrs = new Map(), handlers = new Map();
    return { id, children: [], hidden: true, inert: false, textContent: '',
      classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c) },
      get scrollHeight() { scrollReads++; return 137; },
      appendChild(n) { this.children.push(n); }, replaceChildren() { this.children = []; },
      getAttribute: k => attrs.has(k) ? attrs.get(k) : null,
      setAttribute: (k,v) => attrs.set(k,v), removeAttribute: k => attrs.delete(k),
      addEventListener: (k,f) => handlers.set(k,f), fire: k => handlers.get(k)(),
      focus() { doc.activeElement = this; },
      querySelector() { return id === 'intro' ? ids['hero-title'] : id === 'projects' ? ids['projects-title'] : null; },
      contains: n => ['intro','hero-title','projects','projects-title'].includes(n.id),
      getBoundingClientRect: () => ({ top: (id === 'projects' ? 1400 : 0) - win.scrollY })
    };
  }
  ['boot-screen','boot-output','boot-status','main','intro','hero-title','projects','projects-title'].forEach(id => ids[id] = element(id));
  ids['curiosity-canvas'] = { getContext: () => ({}) };
  const doc = { documentElement: element(), getElementById: id => ids[id],
    querySelectorAll: s => s.startsWith('a[') ? [] : [ids.main],
    createElement: () => element(), createTextNode: text => ({ textContent: text }),
    addEventListener: (k,f) => events.set(k,f), removeEventListener: k => events.delete(k),
    dispatchEvent: e => { if (events.has(e.type)) events.get(e.type)(e); }
  };
  win.scrollTo = ({top}) => { win.scrollY = top; };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'boot.js'), 'utf8'), {
    document: doc, window: win, Event: function(type) { this.type=type; },
    performance: { now: () => now },
    sessionStorage: { getItem() { if(storageFails) throw Error(); return seen ? '1' : null; }, setItem() {} },
    setTimeout: (f, ms) => { timers.set(++timerId, { f, at: now + ms }); return timerId; },
    clearTimeout: id => timers.delete(id)
  });
  function advance(to) {
    while (true) {
      const next = [...timers].sort((a,b) => a[1].at-b[1].at)[0];
      if (!next || next[1].at > to) break;
      now = next[1].at; timers.delete(next[0]); next[1].f(); callbacks++;
      assert(callbacks < 100, 'Timer should settle');
    }
    now = to;
  }
  return { ids, doc, win, advance, timers, callbacks: () => callbacks, scrollReads: () => scrollReads };
}
const normal = setup();
assert.equal(normal.ids['boot-output'].children[0].children[0].textContent, ':');
normal.advance(480);
assert.equal(normal.ids['boot-output'].children[3].children[0].textContent, '[PASS]');
normal.advance(960);
assert.equal(normal.ids['boot-output'].children[6].children[0].textContent, '   routing to portfolio ...');
const reads = normal.scrollReads(); normal.advance(1399); assert.equal(normal.scrollReads(), reads);
normal.advance(1580);
assert.equal(normal.ids['boot-screen'].hidden, true, 'Intro must finish within 1.7 seconds, including exit transition');
assert.equal(normal.win.scrollY, 0); assert.equal(normal.ids.main.inert, false);
assert.equal(normal.doc.activeElement.id, 'hero-title'); assert.equal(normal.ids['boot-status'].textContent, 'Portfolio ready.');
assert.equal(normal.timers.size, 0); assert(normal.callbacks() < 25);
const linked = setup({ hash: '#projects' }); linked.advance(1580);
assert.equal(linked.win.scrollY, 1368); assert.equal(linked.doc.activeElement.id, 'projects-title');
for(const hash of ['#missing', '#%ZZ']) { const t=setup({hash}); t.advance(1580); assert.equal(t.win.scrollY,0); }
const escaped=setup(); escaped.doc.dispatchEvent({type:'keydown',key:'Escape'}); escaped.advance(180);
assert.equal(escaped.ids.main.inert,false); assert.equal(escaped.timers.size,0);
for(const options of [{seen:true},{storageFails:true},{reduced:true}]) {
  const t=setup(options); assert.equal(t.ids['boot-screen'].hidden,true);
  if(!options.reduced) assert(t.doc.documentElement.classList.contains('intro-arriving'));
}
// Use a no-op canvas to verify that boot visibility gates animation scheduling.
const listeners = {}, frames = new Map(); let nextFrame = 0, booting = true;
const ctx = new Proxy({}, {get: (_, k) => k === 'measureText' ? () => ({width:10}) : () => {}});
const canvas = {getContext:()=>ctx,getBoundingClientRect:()=>({width:440,height:360})};
vm.runInNewContext(fs.readFileSync(path.join(root,'curiosity.js'),'utf8'),{
 document:{getElementById:id=>id==='curiosity-canvas'?canvas:{textContent:''},documentElement:{classList:{contains:()=>booting}},hidden:false,addEventListener:(k,f)=>listeners[k]=f},
 window:{matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){},devicePixelRatio:1},
 requestAnimationFrame:f=>{frames.set(++nextFrame,f);return nextFrame},cancelAnimationFrame:id=>frames.delete(id)
});
assert.equal(frames.size,0); booting=false; listeners['portfolio:boot-end'](); assert.equal(frames.size,1);
booting=true; listeners['portfolio:boot-start'](); assert.equal(frames.size,0);
booting=false; listeners['portfolio:boot-end'](); assert.equal(frames.size,1);
console.log('Passed: typed/execution output, idle scheduler, deep links, Escape, focus/status, fallback modes, and canvas pause/resume.');

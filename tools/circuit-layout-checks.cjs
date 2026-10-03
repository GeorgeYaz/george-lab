// Geometry regression: the full-width circuit stays near both viewport edges.
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const path = require('path');
const source = fs.readFileSync(path.join(__dirname, '..', 'scroll-circuit.js'), 'utf8');
const measure = source.slice(source.indexOf('  function measure()'), source.indexOf('  function render('));
for (const width of [240, 280, 320, 390, 720, 768, 900, 1024, 1440, 1536, 1544, 1862, 2560]) {
  const contentWidth = Math.min(1280, width - 120), margin = (width - contentWidth) / 2;
  const sections = Array.from({length: 6}, (_, i) => ({getBoundingClientRect: () => ({left: margin, right: width-margin, top: 144+i*600, height: 600})}));
  const symbol = () => { const attributes = {}; return {group: {setAttribute(k,v){attributes[k]=v;}}, attributes, at: 0}; };
  const classes = new Set();
  const ctx = {main: {getBoundingClientRect: () => ({left:0, top:144, width, height:3600})}, window:{scrollY:0}, sections,
    document:{documentElement:{classList:{contains:k=>classes.has(k),toggle:(k,on)=>on?classes.add(k):classes.delete(k)}},getElementById:()=>({getBoundingClientRect:()=>({left:margin,top:144+3100,height:76})})},
    supply:symbol(), supplyLead:{setAttribute(){}}, mainSwitch:symbol(), endpoint:symbol(), branches:Array.from({length:4},symbol), sectionLabels:[],
    svg:{setAttribute(){}}, track:{setAttribute(){}}, pathFrom:()=>'', points:[], mainTop:0, layoutDirty:true};
  vm.runInNewContext(measure+'\nmeasure();',ctx);
  const left=ctx.points[0].x, right=Math.max(...ctx.points.map(p=>p.x));
  assert(left < margin && right > width-margin);
  assert.equal(left, Math.max(12, Math.min(50, margin - 48)), 'Inward inset respects content clearance');
  assert.equal(right, width - left, 'Both rails move inward equally');
  assert(left >= 12 && right <= width-12, 'Viewport clearance is reserved');
  assert.equal(ctx.points[0].y, 136);
  const transform = ctx.supply.attributes.transform.match(/translate\(([^ ]+) ([^)]+)\) scale\(([^)]+)\)/);
  const [sourceX, sourceY, scale] = transform.slice(1).map(Number);
  assert.equal(sourceX, left, 'Supply never shifts independently from the rail');
  assert.equal(sourceY, 136, 'Supply height does not jump on resize');
  assert.equal(scale, .8);
  assert(sourceX - 10 * scale >= 0, 'Supply stays within viewport');
  assert(sourceX + 48 * scale <= margin - 9, 'Ground stays clear of the intro text');
  assert(ctx.points.every(p=>p.x>=0 && p.x<=width));
  assert(ctx.points.every((p,i)=>!i || p.at>ctx.points[i-1].at));
  assert(ctx.mainSwitch.at+30 < ctx.endpoint.at);
  if(width===1862) console.log(`At screenshot width: rails ${left}px / ${right}px, 50px from the viewport edges.`);
}
console.log('Passed rail clearance, bounds, ordered progress, and switch placement at thirteen viewport widths.');

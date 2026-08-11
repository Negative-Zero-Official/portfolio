// Neural network visualization: a layered network of nodes with signal
// pulses continuously flowing forward through it, lighting up nodes and
// connections as each pulse passes. Multiple staggered pulses are always
// in flight, so the animation loops forever with no reset/jump — pulses
// simply fade out at the output layer while new ones keep entering at
// the input layer.
const canvas = document.getElementById('scope');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize(){
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  window.addEventListener('resize', resize);
  resize();

  const nodeEl = document.getElementById('nodeReadout');
  const layerEl = document.getElementById('layerReadout');
  const statusEl = document.getElementById('statusReadout');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- network topology ----
  // node counts per layer — wide in the middle, narrow at input/output,
  // for a "couple hundred nodes" total, sparsely linked so the pulse reads clearly
  // const LAYER_COUNTS = [16, 32, 44, 52, 52, 44, 32, 16];
  const LAYER_COUNTS = [2, 4, 8, 16, 16, 8, 4, 2];
  const LAYERS = LAYER_COUNTS.length;
  const LINKS_PER_NODE = 2; // sparse connections to keep it readable + performant

  let nodes = [];   // {layer, xFrac, yFrac, brightness}
  let edges = [];   // {a (node idx), b (node idx), layer, brightness}

  function buildNetwork(){
    nodes = [];
    edges = [];
    const layerStartIdx = [];
    LAYER_COUNTS.forEach((count, layerIdx) => {
      layerStartIdx.push(nodes.length);
      const xFrac = LAYERS === 1 ? 0.5 : layerIdx / (LAYERS - 1);
      for(let i=0; i<count; i++){
        // even vertical spread with slight organic jitter, fixed per node
        const base = (i + 0.5) / count;
        const jitter = (Math.sin(layerIdx * 12.9 + i * 78.2) * 0.5) * (0.5 / count);
        nodes.push({ layer: layerIdx, xFrac, yFrac: base + jitter, brightness: 0 });
      }
    });
    // fully connected forward connections between adjacent layers
    for(let l=0; l<LAYERS-1; l++){
      const fromStart = layerStartIdx[l], fromCount = LAYER_COUNTS[l];
      const toStart = layerStartIdx[l+1], toCount = LAYER_COUNTS[l+1];
      for(let i=0; i<fromCount; i++){
        const fromIdx = fromStart + i;
        for(let j=0; j<toCount; j++){
          edges.push({ a: fromIdx, b: toStart + j, layer: l, brightness: 0 });
        }
      }
    }
  }
  buildNetwork();
  if(nodeEl) nodeEl.textContent = `NODES ${nodes.length}`;

  // ---- forward-pass pulses ----
  const FRAMES_PER_LAYER = 35;
  const SPAWN_EVERY = 350; // frames between new pulses — keeps 1–2 in flight, not a wall of light
  const GLOW_WINDOW = 1.5; // how narrow the lit "front" is, in layer-units
  let pulses = []; // {start}
  let t = 0;
  let lastReportedLayer = 1;

  function draw(){
    const rect = canvas.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    ctx.clearRect(0,0,w,h);

    const marginX = w * 0.04, marginY = h * 0.12;
    const plotW = w - marginX*2, plotH = h - marginY*2;
    const px = (n) => marginX + n.xFrac * plotW;
    const py = (n) => marginY + n.yFrac * plotH;

    // spawn new pulses on a steady cadence — independent of any pulse finishing,
    // so there is no shared "reset" moment
    if(!reduceMotion && t % SPAWN_EVERY === 0){
      pulses.push({ start: t });
    }
    // drop pulses once they've fully exited the network
    pulses = pulses.filter(p => (t - p.start) < (LAYERS + 1) * FRAMES_PER_LAYER);

    // decay all brightness slightly each frame (afterglow trail)
    for(const n of nodes) n.brightness *= 0.85;
    for(const e of edges) e.brightness *= 0.80;

    let frontierLayer = 1;
    for(const p of pulses){
      const pos = (t - p.start) / FRAMES_PER_LAYER; // continuous layer position
      frontierLayer = Math.max(frontierLayer, Math.min(LAYERS, Math.ceil(pos)));

      // light up nodes near the pulse's current layer
      for(const n of nodes){
        const d = Math.abs(n.layer - pos);
        if(d < GLOW_WINDOW){
          const b = Math.max(0, 1 - d/GLOW_WINDOW);
          n.brightness = Math.max(n.brightness, b);
        }
      }
      // light up edges currently being "traversed" between two layers
      for(const e of edges){
        const d = Math.abs((e.layer + 0.5) - pos);
        if(d < GLOW_WINDOW){
          const b = Math.max(0, 1 - d/GLOW_WINDOW);
          e.brightness = Math.max(e.brightness, b);
        }
      }
    }

    // edges
    for(const e of edges){
      if(e.brightness < 0.03) {
        ctx.strokeStyle = 'rgba(238,241,248,0.04)';
        ctx.lineWidth = 1;
      } else {
        ctx.strokeStyle = `rgba(130,200,229,${0.10 + e.brightness*0.75})`;
        ctx.lineWidth = 1 + e.brightness*1.3;
      }
      const a = nodes[e.a], b = nodes[e.b];
      ctx.beginPath();
      ctx.moveTo(px(a), py(a));
      ctx.lineTo(px(b), py(b));
      ctx.stroke();
    }

    // nodes
    for(const n of nodes){
      const x = px(n), y = py(n);
      if(n.brightness < 0.04){
        ctx.beginPath();
        ctx.fillStyle = 'rgba(163,174,194,0.35)';
        ctx.arc(x, y, 1.6, 0, Math.PI*2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.fillStyle = `rgba(130,200,229,${0.5 + n.brightness*0.5})`;
        ctx.shadowColor = 'rgba(130,200,229,0.9)';
        ctx.shadowBlur = 6 * n.brightness;
        ctx.arc(x, y, 1.6 + n.brightness*1.8, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // live readouts
    if(layerEl && statusEl){
      lastReportedLayer = Math.max(1, Math.min(LAYERS, frontierLayer));
      layerEl.textContent = `LAYER ${lastReportedLayer}/${LAYERS}`;
      statusEl.textContent = 'ACTIVE ●';
    }

    t += reduceMotion ? 0 : 1;
    requestAnimationFrame(draw);
  }
  draw();
}

// mobile menu toggle
const navToggle = document.getElementById('navToggle');
const mobileMenu = document.getElementById('mobileMenu');
if (navToggle && mobileMenu) {
  navToggle.addEventListener('click', ()=>{
    const open = mobileMenu.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    navToggle.textContent = open ? '✕' : '☰';
  });
  mobileMenu.querySelectorAll('a').forEach(a=>{
    a.addEventListener('click', ()=>{
      mobileMenu.classList.remove('open');
      navToggle.setAttribute('aria-expanded','false');
      navToggle.textContent = '☰';
    });
  });
}

// scroll reveal
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, {threshold:0.12});
revealEls.forEach(el=>io.observe(el));

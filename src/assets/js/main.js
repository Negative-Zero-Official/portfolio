// Training run visualization: a loss curve that trains, converges, then restarts —
// with live epoch / loss / status readouts underneath.
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

  const epochEl = document.getElementById('epochReadout');
  const lossEl = document.getElementById('lossReadout');
  const statusEl = document.getElementById('statusReadout');
  const TOTAL_EPOCHS = 120;
  const REVEAL_FRAMES = 340;   // frames to sweep across the full curve
  const HOLD_FRAMES = 90;      // frames to hold at "converged" before restarting
  const CYCLE = REVEAL_FRAMES + HOLD_FRAMES;

  let t = 0;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // loss value (0..1, high to low) at a given position along the curve, with
  // noise that shrinks as training progresses — mirrors a real training curve
  function lossAt(frac){
    const base = Math.exp(-4.2 * frac);
    const noise = (Math.random() - 0.5) * 0.16 * (1 - frac * 0.85);
    return Math.max(0.015, Math.min(1, base + noise));
  }

  function draw(){
    const rect = canvas.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    ctx.clearRect(0,0,w,h);

    // grid
    ctx.strokeStyle = 'rgba(240,237,247,0.05)';
    ctx.lineWidth = 1;
    for(let x=0; x<w; x+=30){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
    for(let y=0; y<h; y+=30){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }

    const cycle = t % CYCLE;
    const revealFrac = Math.min(1, cycle / REVEAL_FRAMES);
    const marginTop = h * 0.12, marginBottom = h * 0.12;
    const plotH = h - marginTop - marginBottom;

    // curve, drawn up to the current reveal point
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#8b7cf6';
    ctx.shadowColor = 'rgba(139,124,246,0.5)';
    ctx.shadowBlur = 6;

    const steps = Math.max(2, Math.floor(w * revealFrac));
    let lastLoss = 1;
    for(let i=0; i<=steps; i++){
      const x = i;
      const frac = x / w;
      const loss = lossAt(frac);
      lastLoss = loss;
      const y = marginTop + plotH * (1 - loss);
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // live point marker at the sweep edge
    if(revealFrac < 1){
      const x = steps;
      const y = marginTop + plotH * (1 - lastLoss);
      ctx.beginPath();
      ctx.fillStyle = '#8b7cf6';
      ctx.shadowColor = 'rgba(139,124,246,0.8)';
      ctx.shadowBlur = 8;
      ctx.arc(x, y, 3.5, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // baseline
    ctx.strokeStyle = 'rgba(240,237,247,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0,h-marginBottom); ctx.lineTo(w,h-marginBottom); ctx.stroke();

    // live readouts
    if(epochEl && lossEl && statusEl){
      const epoch = Math.min(TOTAL_EPOCHS, Math.round(revealFrac * TOTAL_EPOCHS));
      epochEl.textContent = `EPOCH ${String(epoch).padStart(3,'0')}/${TOTAL_EPOCHS}`;
      lossEl.textContent = `LOSS ${(lastLoss * 0.42).toFixed(4)}`;
      if(revealFrac >= 1){
        statusEl.textContent = 'CONVERGED ●';
      } else {
        statusEl.textContent = 'TRAINING ●';
      }
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

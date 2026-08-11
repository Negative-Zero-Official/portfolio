// Waveform: noise resolving into a clean sine ("real" classification)
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

  let t = 0;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function draw(){
    const rect = canvas.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    ctx.clearRect(0,0,w,h);

    // faint grid
    ctx.strokeStyle = 'rgba(232,236,244,0.05)';
    ctx.lineWidth = 1;
    for(let x=0; x<w; x+=30){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
    for(let y=0; y<h; y+=30){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }

    const mid = h/2;
    // resolve factor: how "clean" the signal is, oscillates 0 (noisy) -> 1 (clean) -> 0
    const cycle = (Math.sin(t*0.006) + 1) / 2; // 0..1
    const resolve = Math.pow(cycle, 1.4);

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#4fd1c5';
    ctx.shadowColor = 'rgba(79,209,197,0.5)';
    ctx.shadowBlur = 6;

    for(let x=0; x<=w; x+=2){
      const clean = Math.sin((x*0.03) + t*0.02) * (h*0.28);
      const noiseAmt = (1-resolve) * (h*0.32);
      const noise = (Math.sin(x*1.7 + t*0.5) * 0.5 + (Math.random()-0.5)) * noiseAmt;
      const y = mid + clean*resolve + noise*(1-resolve) + clean*(1-resolve)*0.15;
      if(x===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // baseline
    ctx.strokeStyle = 'rgba(232,236,244,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0,mid); ctx.lineTo(w,mid); ctx.stroke();

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

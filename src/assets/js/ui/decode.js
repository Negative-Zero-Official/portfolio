// Scramble/decode text reveal for short mono labels ([data-decode]).
// Characters resolve left to right out of a noise alphabet.

const GLYPHS = "·:-=+*#%01░▒";

export function decode(el, { duration = 900 } = {}) {
  const text = el.dataset.decodeText || el.textContent;
  el.dataset.decodeText = text;
  const start = performance.now();
  function tick(now) {
    const p = Math.min(1, (now - start) / duration);
    const solved = Math.floor(p * text.length);
    let out = text.slice(0, solved);
    for (let i = solved; i < text.length; i++) {
      out += text[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

export function initDecode(reducedMotion) {
  const els = document.querySelectorAll("[data-decode]");
  if (reducedMotion || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      decode(e.target);
    }
  }, { rootMargin: "0px 0px -10% 0px" });
  els.forEach((el) => io.observe(el));
}

export function initReveal(reducedMotion) {
  const els = document.querySelectorAll(".reveal");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      e.target.classList.add("is-in");
    }
  }, { rootMargin: "0px 0px -8% 0px" });
  els.forEach((el) => io.observe(el));
}

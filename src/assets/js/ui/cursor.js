// Ring cursor for fine pointers: grows over links, turns into an amber
// "View" disc over project rows.

export function initCursor() {
  const el = document.getElementById("cursor");
  if (!el) return;
  document.body.classList.add("has-cursor");
  let x = -100, y = -100, cx = -100, cy = -100;

  window.addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
  document.addEventListener("pointerleave", () => { x = y = -100; });

  document.addEventListener("pointerover", (e) => {
    const view = e.target.closest(".index-row, .pager-link");
    const link = e.target.closest("a, button");
    el.classList.toggle("is-view", !!view);
    el.classList.toggle("is-hover", !view && !!link);
  });

  (function loop() {
    cx += (x - cx) * 0.22;
    cy += (y - cy) * 0.22;
    el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(loop);
  })();
}

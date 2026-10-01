// The director: watches scroll position, hovers and clicks, and tells the
// stage which shape to show, where to put it, and what the plate caption
// should say.

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { decode } from "./ui/decode.js";

gsap.registerPlugin(ScrollTrigger);

// Where the sculpture sits for each story shape. x/y are fractions of the
// half-viewport (0 = centre, 0.5 = halfway to the right edge).
const LAYOUTS = {
  neuron: { x: 0.52, y: 0.02, scale: 1.12, opacity: 1 },
  column: { x: 0.5, y: 0, scale: 0.95, opacity: 0.9 },
  mlp: { x: 0.42, y: 0, scale: 0.85, opacity: 0.85 },
  attention: { x: 0.38, y: 0, scale: 0.95, opacity: 0.4 },
  embedding: { x: 0.1, y: 0, scale: 1.1, opacity: 0.55 },
};
const PROJECT_LAYOUT = { x: 0.58, y: 0, scale: 0.9, opacity: 0.45 };
const PREVIEW_OPACITY = 0.9;

export function createDirector({ stage, reducedMotion, isTouch }) {
  const narrow = () => window.innerWidth < 860;
  const plate = document.getElementById("plate");
  const plateFig = document.getElementById("plateFig");
  const plateCap = document.getElementById("plateCap");

  let active = null; // the [data-scene] element currently in view

  function layoutFor(shape, base) {
    const l = { ...(base || LAYOUTS[shape] || PROJECT_LAYOUT) };
    if (narrow()) { l.x = 0; l.y = l.y + 0.05; l.opacity *= 0.45; l.scale *= 1.1; }
    return l;
  }

  function setCaption(fig, text) {
    if (!plate || !text) return;
    if (plateCap.dataset.decodeText === text) return;
    plateFig.textContent = fig ? `Fig. ${fig}` : "";
    plateCap.dataset.decodeText = text;
    if (reducedMotion) plateCap.textContent = text;
    else decode(plateCap, { duration: 700 });
  }

  function activate(el) {
    active = el;
    const shape = el.dataset.scene;
    const isProject = el.classList.contains("project");
    stage.morphTo(shape);
    stage.setLayout(layoutFor(shape, isProject ? PROJECT_LAYOUT : null));
    stage.setQuery(el.dataset.query === "true");
    if (el.dataset.caption) setCaption(el.dataset.fig, el.dataset.caption);
  }

  // ── smooth scroll ──
  let lenis = null;
  if (!reducedMotion) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // same-page anchor links go through Lenis
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    const target = document.querySelector(url.hash);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 1.6 });
    else target.scrollIntoView();
    history.replaceState(null, "", url.hash);
  });

  // ── scenes on scroll ──
  const scenes = [...document.querySelectorAll("[data-scene]")];
  scenes.forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: "top 55%",
      end: "bottom 55%",
      onToggle: (self) => { if (self.isActive) activate(el); },
    });
  });

  // ── project index: hover / focus previews the project's shape ──
  const index = document.getElementById("projectIndex");
  if (index) {
    const rows = [...index.querySelectorAll(".index-row")];
    const preview = (row) => {
      rows.forEach((r) => r.classList.toggle("is-active", r === row));
      stage.morphTo(row.dataset.shape, { duration: 1.2 });
      stage.setLayout({ ...layoutFor("attention"), opacity: narrow() ? 0.5 : PREVIEW_OPACITY });
      const n = row.querySelector(".index-no")?.textContent;
      setCaption(n, row.dataset.title);
    };
    const restore = () => {
      rows.forEach((r) => r.classList.remove("is-active"));
      if (active) activate(active);
    };
    rows.forEach((row) => {
      if (!isTouch) row.addEventListener("pointerenter", () => preview(row));
      row.addEventListener("focus", () => preview(row));
      // touch: first tap previews, second tap opens
      if (isTouch) {
        row.addEventListener("click", (e) => {
          if (!row.classList.contains("is-active")) { e.preventDefault(); e.stopImmediatePropagation(); preview(row); }
        }, true);
      }
    });
    if (!isTouch) index.addEventListener("pointerleave", restore);
    index.addEventListener("focusout", (e) => { if (!index.contains(e.relatedTarget)) restore(); });
  }

  // ── page transitions between home and project pages ──
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest("a[href]");
    if (!a || a.target === "_blank") return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname === location.pathname) return;
    e.preventDefault();
    document.body.classList.add("is-leaving");
    const shape = a.dataset.shape || (url.hash === "#work" ? "attention" : "neuron");
    stage.morphTo(shape, { duration: 0.9 });
    setTimeout(() => { location.href = url.href; }, reducedMotion ? 0 : 520);
  });
  // coming back via the back button restores a page from bfcache mid-fade
  window.addEventListener("pageshow", (e) => { if (e.persisted) document.body.classList.remove("is-leaving"); });

  window.addEventListener("resize", () => { if (active) activate(active); });

  return {
    // pick whichever scene is in view right now (used once at boot)
    activateInitial() {
      ScrollTrigger.refresh();
      const mid = window.innerHeight * 0.55;
      const inView = scenes.find((el) => {
        const r = el.getBoundingClientRect();
        return r.top <= mid && r.bottom >= mid;
      }) || scenes[0];
      if (inView) activate(inView);
    },
    lenis,
  };
}

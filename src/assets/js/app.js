// Entry point (bundled by esbuild into _site/assets/js/app.js).
//
// Detects what the device can handle, boots the WebGL stage, plays the
// intro loader on a first visit, and hands control to the director.

import { createStage } from "./scene/stage.js";
import { getShape, resolveShape, STORY } from "./scene/shapes/index.js";
import { createDirector } from "./director.js";
import { initDecode, initReveal } from "./ui/decode.js";
import { initCursor } from "./ui/cursor.js";

window.__pgBooted = true;

const root = document.documentElement;
const body = document.body;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
const lowPower = isTouch || window.innerWidth < 860 || (navigator.hardwareConcurrency || 8) <= 4;

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch (e) { return false; }
}

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function initMenu() {
  const btn = document.getElementById("navMenu");
  const sheet = document.getElementById("navSheet");
  if (!btn || !sheet) return;
  const set = (open) => {
    body.classList.toggle("menu-open", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.textContent = open ? "Close" : "Menu";
  };
  btn.addEventListener("click", () => set(!body.classList.contains("menu-open")));
  sheet.addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
}

async function boot() {
  initMenu();
  if (!isTouch && !reducedMotion) initCursor();

  let stage = null;
  if (hasWebGL()) {
    try {
      stage = createStage(document.getElementById("stage"), {
        count: lowPower ? 14000 : 56000,
        reducedMotion,
        maxDpr: lowPower ? 1.5 : 2,
      });
    } catch (e) {
      console.warn("WebGL stage failed to start", e);
    }
  }
  if (!stage) {
    root.classList.add("no-webgl");
    stage = nullStage();
  }

  const N = lowPower ? 14000 : 56000;
  const pageShape = resolveShape(body.dataset.shape || "neuron");

  // Start from wherever the previous page left the sculpture, so moving
  // between pages reads as one continuous object.
  let fromShape = null;
  try { fromShape = sessionStorage.getItem("pg-shape"); } catch (e) {}
  stage.morphTo(fromShape || pageShape, { immediate: true });
  stage.start();

  const loader = document.getElementById("loader");
  const showIntro = loader && !root.classList.contains("intro-seen") && !reducedMotion;

  if (showIntro) {
    // Precompute the story shapes while the counter runs (one per frame,
    // so the counter keeps moving), but never show it for less than ~1.4 s.
    const count = document.getElementById("loaderCount");
    const t0 = performance.now();
    let shown = 0;
    const setCount = (v) => { count.textContent = String(Math.round(v)).padStart(3, "0"); };
    for (let i = 0; i < STORY.length; i++) {
      getShape(STORY[i], N);
      const target = ((i + 1) / STORY.length) * 100;
      while (shown < target) {
        await nextFrame();
        const minProgress = Math.min(100, ((performance.now() - t0) / 1400) * 100);
        shown = Math.min(target, minProgress);
        setCount(shown);
      }
    }
    await wait(150);
    loader.classList.add("is-done");
    try { sessionStorage.setItem("pg-intro-seen", "1"); } catch (e) {}
  } else if (loader) {
    loader.classList.add("is-done"); // e.g. reduced motion: skip the intro
  }

  const director = createDirector({ stage, reducedMotion, isTouch });

  initReveal(reducedMotion);
  initDecode(reducedMotion);
  body.classList.add("is-ready");
  director.activateInitial();
  stage.firePulse(showIntro ? 0.3 : 0);

  // cursor → stage (repulsion, parallax, query mode)
  window.addEventListener("pointermove", (e) => {
    stage.setPointer((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  }, { passive: true });

  // Warm the cache for the remaining shapes when the browser is idle, so
  // the first hover over a project doesn't hitch.
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
  const pending = [...STORY, ...[...document.querySelectorAll("[data-shape]")].map((el) => el.dataset.shape)];
  const warm = () => {
    const name = pending.shift();
    if (!name) return;
    getShape(name, N);
    idle(warm);
  };
  idle(warm);
}

// A stand-in with the same API when WebGL is unavailable
function nullStage() {
  const noop = () => {};
  return { morphTo: noop, setLayout: noop, setPointer: noop, setQuery: noop, firePulse: noop, start: noop, stop: noop, requestRender: noop };
}

boot();

// The persistent WebGL stage: one camera, one point cloud, and the API the
// rest of the site uses to drive it (morph, layout, cursor, pulses).

import {
  WebGLRenderer, Scene, PerspectiveCamera, BufferGeometry, BufferAttribute,
  ShaderMaterial, Points, Group, Color, NormalBlending,
} from "three";
import { gsap } from "gsap";
import { vertexShader, fragmentShader } from "./shaders.js";
import { getShape, resolveShape } from "./shapes/index.js";

const FOV = 35;
const CAM_Z = 5.6;
const SHAPE_WIDTH = 3.5; // shapes are authored to fit roughly this wide

function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

export function createStage(canvas, { count, reducedMotion, maxDpr }) {
  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 50);
  camera.position.z = CAM_Z;

  const N = count;
  const geometry = new BufferGeometry();
  const aFrom = new Float32Array(N * 3);
  const aTo = new Float32Array(N * 3);
  const aPathFrom = new Float32Array(N);
  const aPathTo = new Float32Array(N);
  const aRand = new Float32Array(N * 3);
  for (let i = 0; i < N * 3; i++) aRand[i] = Math.random();

  geometry.setAttribute("position", new BufferAttribute(aTo, 3)); // bounds only
  geometry.setAttribute("aFrom", new BufferAttribute(aFrom, 3));
  geometry.setAttribute("aTo", new BufferAttribute(aTo, 3));
  geometry.setAttribute("aPathFrom", new BufferAttribute(aPathFrom, 1));
  geometry.setAttribute("aPathTo", new BufferAttribute(aPathTo, 1));
  geometry.setAttribute("aRand", new BufferAttribute(aRand, 3));

  const uniforms = {
    uTime: { value: 0 },
    uMorph: { value: 1 },
    uSize: { value: N > 30000 ? 10.5 : 13 },
    uPixelRatio: { value: 1 },
    uPulse: { value: -1 },
    uMouse: { value: [99, 99, 0] },
    uMouseStrength: { value: 0 },
    uQuery: { value: 0 },
    uBone: { value: new Color("#e9e1cf") },
    uStain: { value: new Color("#e0892b") },
    uOpacity: { value: 1 },
  };
  const material = new ShaderMaterial({
    vertexShader, fragmentShader, uniforms,
    transparent: true, depthWrite: false, blending: NormalBlending,
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  const group = new Group();
  group.add(points);
  scene.add(group);

  // ── layout: where on screen the sculpture sits, how big, how bright ──
  const layout = { x: 0, y: 0, scale: 1, opacity: 1 };
  const layoutTarget = { ...layout };
  let halfW = 1, halfH = 1;

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    halfH = Math.tan((FOV * Math.PI) / 360) * CAM_Z;
    halfW = halfH * camera.aspect;
    uniforms.uPixelRatio.value = dpr * (h / 900); // keep dot size proportional to viewport
    requestRender();
  }

  // ── morphing ──
  let current = null;
  let morphTween = null;

  // Bake the in-flight morph into aFrom so a new morph starts from where
  // particles actually are (mirrors the stagger/ease in the vertex shader)
  function snapshot() {
    const m = uniforms.uMorph.value;
    if (m >= 1) { aFrom.set(aTo); aPathFrom.set(aPathTo); return; }
    for (let i = 0; i < N; i++) {
      const t = Math.min(1, Math.max(0, m * 1.5 - aRand[i * 3] * 0.5));
      const e = ease(t);
      for (let k = 0; k < 3; k++) aFrom[i * 3 + k] += (aTo[i * 3 + k] - aFrom[i * 3 + k]) * e;
      aPathFrom[i] += (aPathTo[i] - aPathFrom[i]) * e;
    }
  }

  function morphTo(name, { duration = 1.6, immediate = false } = {}) {
    const key = resolveShape(name);
    if (key === current) return;
    current = key;
    try { sessionStorage.setItem("pg-shape", key); } catch (e) {}
    const shape = getShape(key, N);
    snapshot();
    aTo.set(shape.positions);
    aPathTo.set(shape.path);
    if (immediate || reducedMotion) aFrom.set(aTo), aPathFrom.set(aPathTo);
    for (const n of ["aFrom", "aTo", "aPathFrom", "aPathTo"]) geometry.attributes[n].needsUpdate = true;
    morphTween?.kill();
    if (immediate || reducedMotion) {
      uniforms.uMorph.value = 1;
      requestRender();
    } else {
      uniforms.uMorph.value = 0;
      morphTween = gsap.to(uniforms.uMorph, { value: 1, duration, ease: "none" });
      firePulse(duration * 0.55);
    }
  }

  // ── action potentials ──
  let pulseStart = -10;
  let clock = 0;
  function firePulse(delay = 0) { pulseStart = clock + delay; }

  // ── cursor ──
  // `target` jumps to 1 on movement and decays at rest; `strength` eases
  // toward it so the push ramps back in instead of snapping on.
  const mouse = { x: 99, y: 99, tx: 99, ty: 99, strength: 0, target: 0 };
  function setPointer(ndcX, ndcY) {
    mouse.tx = ndcX * halfW;
    mouse.ty = ndcY * halfH;
    if (mouse.x > 50) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
    mouse.target = 1;
  }
  function setQuery(on) { gsap.to(uniforms.uQuery, { value: on ? 1 : 0, duration: 0.8 }); }

  function setLayout(next, immediate = false) {
    Object.assign(layoutTarget, next);
    if (immediate || reducedMotion) { Object.assign(layout, layoutTarget); requestRender(); }
  }

  // ── loop ──
  let running = false;
  let last = performance.now();
  function requestRender() { if (!running) frame(performance.now()); }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!reducedMotion) clock += dt;

    // ease layout toward its target
    const k = 1 - Math.pow(0.0015, dt);
    for (const p of ["x", "y", "scale", "opacity"]) layout[p] += (layoutTarget[p] - layout[p]) * (reducedMotion ? 1 : k);
    const fit = Math.min(1, (halfW * 2 * 0.92) / SHAPE_WIDTH);
    group.position.x = layout.x * halfW;
    group.position.y = layout.y * halfH;
    group.scale.setScalar(layout.scale * fit);
    uniforms.uOpacity.value = layout.opacity;

    // slow turntable + parallax from the cursor
    mouse.x += (mouse.tx - mouse.x) * 0.12;
    mouse.y += (mouse.ty - mouse.y) * 0.12;
    mouse.target *= Math.pow(0.985, dt * 60);
    mouse.strength += (mouse.target - mouse.strength) * (1 - Math.pow(0.02, dt));
    const px = mouse.tx > 50 ? 0 : mouse.tx / halfW, py = mouse.ty > 50 ? 0 : mouse.ty / halfH;
    group.rotation.y = Math.sin(clock * 0.12) * 0.45 + px * 0.18;
    group.rotation.x = -py * 0.1;
    group.updateMatrixWorld();

    uniforms.uTime.value = clock;
    uniforms.uMouse.value[0] = mouse.x;
    uniforms.uMouse.value[1] = mouse.y;
    uniforms.uMouseStrength.value = mouse.strength;

    // pulse: one sweep per firing, plus a spontaneous one every ~6 s
    const since = clock - pulseStart;
    if (since > 6.5) pulseStart = clock;
    uniforms.uPulse.value = reducedMotion ? -1 : since * 0.55 - 0.1;

    renderer.render(scene, camera);
    if (running) requestAnimationFrame(frame);
  }

  function start() {
    if (running || reducedMotion) { requestRender(); return; }
    running = true; last = performance.now(); requestAnimationFrame(frame);
  }
  function stop() { running = false; }

  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  resize();

  return { morphTo, setLayout, setPointer, setQuery, firePulse, start, stop, requestRender, get current() { return current; } };
}

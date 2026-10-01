// Shared helpers for the shape generators.
//
// Every shape is a pure function (N, rng) -> { positions, path } where
//   positions : Float32Array(N * 3)  — target xyz for each particle
//   path      : Float32Array(N)      — 0..1 "distance along the structure",
//                                      used by the shader to send an amber
//                                      action-potential band through it.
// Shapes should fit roughly inside a 3.4 × 2.6 box centred on the origin.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Standard normal via Box–Muller
export function gauss(rng) {
  let u = 0;
  while (u === 0) u = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

export function makeBuffers(N) {
  return { positions: new Float32Array(N * 3), path: new Float32Array(N) };
}

export function setPoint(buf, i, x, y, z, p) {
  buf.positions[i * 3] = x;
  buf.positions[i * 3 + 1] = y;
  buf.positions[i * 3 + 2] = z;
  buf.path[i] = p;
}

// Fill [start, end) with sparse ambient "dust" so every shape has a faint
// halo — keeps morphs from looking like particles teleport out of nowhere.
export function fillDust(buf, start, end, rng, radius = 2.6) {
  for (let i = start; i < end; i++) {
    const r = radius * Math.cbrt(rng());
    const th = rng() * Math.PI * 2;
    const ph = Math.acos(2 * rng() - 1);
    setPoint(buf, i,
      r * Math.sin(ph) * Math.cos(th) * 1.3,
      r * Math.sin(ph) * Math.sin(th) * 0.8,
      r * Math.cos(ph) * 0.6,
      rng());
  }
}

// Sample `count` points along a list of segments, weighted by segment length.
// seg = { a:[x,y,z], b:[x,y,z], pa, pb, ra, rb }  (path + radius at each end)
export function sampleSegments(buf, start, count, segs, rng) {
  if (!segs.length) return;
  const lens = segs.map((s) => Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1], s.b[2] - s.a[2]) + 1e-6);
  const cum = new Float64Array(lens.length);
  let total = 0;
  lens.forEach((l, k) => { total += l; cum[k] = total; });
  for (let i = 0; i < count; i++) {
    const target = rng() * total;
    let lo = 0, hi = cum.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] < target) lo = mid + 1; else hi = mid; }
    const s = segs[lo];
    const t = rng();
    const r = (s.ra ?? 0.01) + ((s.rb ?? s.ra ?? 0.01) - (s.ra ?? 0.01)) * t;
    setPoint(buf, start + i,
      s.a[0] + (s.b[0] - s.a[0]) * t + gauss(rng) * r,
      s.a[1] + (s.b[1] - s.a[1]) * t + gauss(rng) * r,
      s.a[2] + (s.b[2] - s.a[2]) * t + gauss(rng) * r,
      (s.pa ?? 0) + ((s.pb ?? 0) - (s.pa ?? 0)) * t);
  }
}

export function normalize3(v) {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

// Rotate a direction by small random angles — used for wiggly dendrites
export function jitterDir(d, amt, rng) {
  return normalize3([d[0] + (rng() - 0.5) * amt, d[1] + (rng() - 0.5) * amt, d[2] + (rng() - 0.5) * amt]);
}

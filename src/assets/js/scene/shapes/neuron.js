// Cajal-style pyramidal neuron: a teardrop soma, a long apical dendrite
// with a branching tuft, a skirt of basal dendrites, and a thin axon with
// collaterals and a terminal arbour. Also used (scaled down) by `column`.

import { makeBuffers, setPoint, fillDust, sampleSegments, normalize3, jitterDir } from "./util.js";

function perpendicular(d, rng) {
  // random unit vector perpendicular to d
  let v = [rng() - 0.5, rng() - 0.5, rng() - 0.5];
  const dot = v[0] * d[0] + v[1] * d[1] + v[2] * d[2];
  v = [v[0] - dot * d[0], v[1] - dot * d[1], v[2] - dot * d[2]];
  return normalize3(v);
}

function splitDir(d, angle, rng) {
  const p = perpendicular(d, rng);
  const t = Math.tan(angle);
  return normalize3([d[0] + p[0] * t, d[1] + p[1] * t, d[2] + p[2] * t]);
}

// Grow one tortuous branch as a chain of short segments, recursively
// spawning side branches and a terminal fork.
function grow(segs, start, dir, len, r, depth, dist, rng, o) {
  const steps = 5 + Math.floor(rng() * 4);
  const stepLen = len / steps;
  let cur = start, d = dir;
  for (let s = 0; s < steps; s++) {
    d = jitterDir(d, o.wiggle, rng);
    if (o.bias) d = normalize3([d[0] + o.bias[0], d[1] + o.bias[1], d[2] + o.bias[2]]);
    const next = [cur[0] + d[0] * stepLen, cur[1] + d[1] * stepLen, cur[2] + d[2] * stepLen];
    segs.push({ a: cur, b: next, pa: dist, pb: dist + stepLen, ra: r, rb: r * 0.93, kind: o.kind });
    r *= 0.93; dist += stepLen; cur = next;
    if (depth > 0 && s > 0 && s < steps - 1 && rng() < o.sideProb) {
      grow(segs, cur, splitDir(d, 0.7 + rng() * 0.6, rng), len * o.sideScale, r * 0.7, depth - 1, dist, rng, o);
    }
  }
  if (depth > 0) {
    const forks = rng() < o.triProb ? 3 : 2;
    for (let f = 0; f < forks; f++) {
      grow(segs, cur, splitDir(d, 0.35 + rng() * 0.45, rng), len * (0.6 + rng() * 0.2), r * 0.75, depth - 1, dist, rng, o);
    }
  }
}

// Returns raw segments (path in absolute distance) for one neuron
export function neuronSegments(rng, { scale = 1, center = [0, 0, 0], tilt = 0 } = {}) {
  const segs = [];
  const somaR = 0.15;
  const soma = [0, 0.15, 0];

  // Apical dendrite: long, mostly upward, tufted at the top
  grow(segs, [0, soma[1] + somaR * 1.1, 0], [0, 1, 0], 0.55, 0.02, 3, 0, rng,
    { wiggle: 0.35, sideProb: 0.32, sideScale: 0.35, triProb: 0.3, bias: [0, 0.18, 0], kind: 0 });

  // Basal dendrites radiating from the lower soma
  const nBasal = 5 + Math.floor(rng() * 3);
  for (let b = 0; b < nBasal; b++) {
    const a = (b / nBasal) * Math.PI * 2 + rng() * 0.6;
    const dir = normalize3([Math.cos(a), -0.35 - rng() * 0.5, Math.sin(a) * 0.8]);
    grow(segs, [soma[0] + dir[0] * somaR, soma[1] + dir[1] * somaR, soma[2] + dir[2] * somaR], dir,
      0.34 + rng() * 0.12, 0.014, 3, 0, rng,
      { wiggle: 0.6, sideProb: 0.25, sideScale: 0.5, triProb: 0.15, kind: 0 });
  }

  // Axon: thin, straight-ish, long; collaterals + terminal arbour
  grow(segs, [0, soma[1] - somaR * 1.2, 0], [0.05, -1, 0], 0.7, 0.007, 2, 0, rng,
    { wiggle: 0.18, sideProb: 0.35, sideScale: 0.32, triProb: 0.6, bias: [0, -0.1, 0], kind: 1 });

  // transform: tilt (around z), scale, translate
  const c = Math.cos(tilt), s = Math.sin(tilt);
  const tf = (p) => {
    const x = p[0] * c - p[1] * s, y = p[0] * s + p[1] * c;
    return [x * scale + center[0], y * scale + center[1], p[2] * scale + center[2]];
  };
  let maxDist = 0;
  for (const g of segs) maxDist = Math.max(maxDist, g.pb);
  for (const g of segs) {
    g.a = tf(g.a); g.b = tf(g.b);
    g.ra *= scale; g.rb *= scale;
    g.pa /= maxDist; g.pb /= maxDist;
  }
  return { segs, soma: tf(soma), somaR: somaR * scale };
}

export function fillSoma(buf, start, count, soma, r, rng) {
  for (let i = 0; i < count; i++) {
    // teardrop: denser near surface, pointed upward into the apical trunk
    const th = rng() * Math.PI * 2;
    const ph = Math.acos(2 * rng() - 1);
    const rad = r * (0.75 + 0.25 * Math.sqrt(rng()));
    let x = Math.sin(ph) * Math.cos(th), y = Math.cos(ph), z = Math.sin(ph) * Math.sin(th);
    const taper = y > 0 ? 1 - y * 0.45 : 1;
    setPoint(buf, start + i, soma[0] + x * rad * taper, soma[1] + y * rad * 1.25, soma[2] + z * rad * taper, 0);
  }
}

export default function neuron(N, rng) {
  const buf = makeBuffers(N);
  const nDust = Math.floor(N * 0.05);
  const nSoma = Math.floor(N * 0.12);
  const nSpine = Math.floor(N * 0.1);
  const nBranch = N - nDust - nSoma - nSpine;

  const { segs, soma, somaR } = neuronSegments(rng, { scale: 0.82, center: [0, 0.05, 0], tilt: -0.08 });
  fillSoma(buf, 0, nSoma, soma, somaR, rng);
  sampleSegments(buf, nSoma, nBranch, segs, rng);

  // Dendritic spines: same dendrite segments, sampled with a wider spread
  const dendrites = segs.filter((g) => g.kind === 0).map((g) => ({ ...g, ra: g.ra * 2.6 + 0.008, rb: g.rb * 2.6 + 0.008 }));
  sampleSegments(buf, nSoma + nBranch, nSpine, dendrites, rng);

  fillDust(buf, N - nDust, N, rng);
  return buf;
}



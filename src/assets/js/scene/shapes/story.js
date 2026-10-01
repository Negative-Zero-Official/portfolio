// The four shapes that follow the neuron in the scroll story:
// cortical column → multilayer perceptron → self-attention → embedding space.

import { makeBuffers, setPoint, fillDust, sampleSegments, gauss } from "./util.js";
import { neuronSegments, fillSoma } from "./neuron.js";

// A small sphere-ish clump of points (used for network "units")
function fillBall(buf, start, count, c, r, p, rng) {
  for (let i = 0; i < count; i++) {
    setPoint(buf, start + i, c[0] + gauss(rng) * r, c[1] + gauss(rng) * r, c[2] + gauss(rng) * r, p);
  }
}

// ── Cortical column: several small neurons stacked in layers ─────────
export function column(N, rng) {
  const buf = makeBuffers(N);
  const nDust = Math.floor(N * 0.05);
  const layers = [
    { y: 0.85, n: 2 }, { y: 0.15, n: 3 }, { y: -0.6, n: 2 },
  ];
  const cells = [];
  layers.forEach((L, li) => {
    for (let k = 0; k < L.n; k++) {
      const a = (k / L.n) * Math.PI * 2 + li * 0.9;
      cells.push({ center: [Math.cos(a) * 0.55, L.y + (rng() - 0.5) * 0.15, Math.sin(a) * 0.45], li });
    }
  });
  const per = Math.floor((N - nDust) / cells.length);
  let idx = 0;
  cells.forEach((cell, ci) => {
    const n = ci === cells.length - 1 ? N - nDust - idx : per;
    const { segs, soma, somaR } = neuronSegments(rng, { scale: 0.36, center: cell.center, tilt: (rng() - 0.5) * 0.4 });
    // stagger the pulse by layer, so firing travels down the column
    segs.forEach((g) => { g.pa = g.pa * 0.6 + cell.li * 0.18; g.pb = g.pb * 0.6 + cell.li * 0.18; });
    const nSoma = Math.floor(n * 0.14);
    fillSoma(buf, idx, nSoma, soma, somaR, rng);
    for (let i = idx; i < idx + nSoma; i++) buf.path[i] = cell.li * 0.18;
    sampleSegments(buf, idx + nSoma, n - nSoma, segs, rng);
    idx += n;
  });
  fillDust(buf, N - nDust, N, rng);
  return buf;
}

// ── Multilayer perceptron: unit clusters + weighted edges ────────────
export function mlp(N, rng) {
  const buf = makeBuffers(N);
  const nDust = Math.floor(N * 0.04);
  const sizes = [4, 7, 9, 9, 7, 3];
  const W = 3.0;
  const units = [];
  sizes.forEach((n, l) => {
    const x = -W / 2 + (l / (sizes.length - 1)) * W;
    for (let k = 0; k < n; k++) {
      // each layer arranged on a slanted vertical ring, for depth
      const a = (k / n) * Math.PI * 2 + l * 0.4;
      const ry = 0.3 + n * 0.1;
      units.push({ l, c: [x, Math.sin(a) * ry, Math.cos(a) * ry * 0.28], p: l / (sizes.length - 1) });
    }
  });
  const segs = [];
  for (const a of units) for (const b of units) {
    if (b.l !== a.l + 1) continue;
    if (rng() < 0.5) continue; // sparse, so individual weights read
    segs.push({ a: a.c, b: b.c, pa: a.p, pb: b.p, ra: 0.004, rb: 0.004 });
  }
  const nUnits = Math.floor((N - nDust) * 0.38);
  const per = Math.floor(nUnits / units.length);
  units.forEach((u, i) => fillBall(buf, i * per, per, u.c, 0.045, u.p, rng));
  const used = per * units.length;
  sampleSegments(buf, used, N - nDust - used, segs, rng);
  fillDust(buf, N - nDust, N, rng);
  return buf;
}

// ── Self-attention: a row of tokens, weighted arcs between them, and
//    the attention matrix laid out as a heat-map floor ───────────────
export function attention(N, rng) {
  const buf = makeBuffers(N);
  const nDust = Math.floor(N * 0.04);
  const T = 10;
  const W = 3.0;
  const tokX = (i) => -W / 2 + (i / (T - 1)) * W;
  const baseY = -0.35;

  // structured attention weights: local + a couple of long-range "heads"
  const att = [];
  for (let i = 0; i < T; i++) {
    const row = [];
    let sum = 0;
    for (let j = 0; j < T; j++) {
      let w = Math.exp(-Math.abs(i - j) * 0.9) + (j === 0 ? 0.6 : 0) + (Math.abs(i - j) === 4 ? 0.5 : 0) + rng() * 0.15;
      row.push(w); sum += w;
    }
    att.push(row.map((w) => w / sum));
  }

  // tokens
  const nTok = Math.floor((N - nDust) * 0.12);
  const perTok = Math.floor(nTok / T);
  for (let i = 0; i < T; i++) fillBall(buf, i * perTok, perTok, [tokX(i), baseY, 0], 0.05, i / T, rng);
  let idx = perTok * T;

  // arcs (semicircles above the token row), density ∝ weight
  const nArc = Math.floor((N - nDust) * 0.46);
  const arcs = [];
  let wsum = 0;
  for (let i = 0; i < T; i++) for (let j = 0; j < T; j++) {
    if (i === j) continue;
    const w = att[i][j];
    if (w < 0.07) continue;
    arcs.push({ i, j, w, z: (rng() - 0.5) * 0.3 }); wsum += w;
  }
  for (const arc of arcs) {
    const n = Math.floor(nArc * (arc.w / wsum));
    const x0 = tokX(arc.i), x1 = tokX(arc.j);
    const R = Math.abs(x1 - x0) / 2, cx = (x0 + x1) / 2;
    for (let k = 0; k < n && idx < N - nDust; k++) {
      const t = rng();
      const ang = Math.PI * (x1 > x0 ? 1 - t : t);
      setPoint(buf, idx++,
        cx + Math.cos(ang) * R + gauss(rng) * 0.006,
        baseY + Math.sin(ang) * R * 0.75 + gauss(rng) * 0.006,
        arc.z + gauss(rng) * 0.006,
        t);
    }
  }

  // attention matrix floor (x–z plane), density ∝ weight
  const floorY = -1.05;
  const cell = W / T;
  while (idx < N - nDust) {
    const i = Math.floor(rng() * T), j = Math.floor(rng() * T);
    if (rng() > att[i][j] * 3.2) continue;
    setPoint(buf, idx++,
      -W / 2 + (j + rng()) * cell,
      floorY + gauss(rng) * 0.01,
      -0.9 + (i + rng()) * (1.8 / T),
      (i + j) / (2 * T));
  }
  fillDust(buf, N - nDust, N, rng);
  return buf;
}

// ── Embedding space: anisotropic Gaussian clusters (t-SNE-ish) ──────
export function embedding(N, rng) {
  const buf = makeBuffers(N);
  const nDust = Math.floor(N * 0.1);
  const K = 9;
  const clusters = [];
  for (let k = 0; k < K; k++) {
    const a = (k / K) * Math.PI * 2 + rng() * 0.5;
    const r = 0.5 + rng() * 1.0;
    clusters.push({
      c: [Math.cos(a) * r * 1.25, Math.sin(a) * r * 0.75, (rng() - 0.5) * 1.0],
      s: [0.08 + rng() * 0.16, 0.06 + rng() * 0.12, 0.06 + rng() * 0.12],
      w: 0.5 + rng(),
      p: k / K,
    });
  }
  const wsum = clusters.reduce((a, c) => a + c.w, 0);
  let idx = 0;
  clusters.forEach((cl, k) => {
    const n = k === K - 1 ? N - nDust - idx : Math.floor((N - nDust) * (cl.w / wsum));
    for (let i = 0; i < n; i++) {
      setPoint(buf, idx++,
        cl.c[0] + gauss(rng) * cl.s[0],
        cl.c[1] + gauss(rng) * cl.s[1],
        cl.c[2] + gauss(rng) * cl.s[2],
        cl.p + rng() * 0.05);
    }
  });
  fillDust(buf, N - nDust, N, rng, 2.2);
  return buf;
}

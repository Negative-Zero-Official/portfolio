// Shapes the sculpture morphs into when a project is hovered / opened.
// Pick one per project with `shape:` in its front matter.

import { makeBuffers, setPoint, fillDust, sampleSegments, gauss } from "./util.js";

// iSLEEPS — stacked EEG channels with spindles and K-complexes,
// plus a hypnogram step trace underneath
export function waveform(N, rng) {
  const buf = makeBuffers(N);
  const nDust = Math.floor(N * 0.04);
  const C = 6, W = 3.2;
  const bursts = Array.from({ length: 5 }, () => ({ x: rng() * 2 - 1, f: 22 + rng() * 10 }));
  const signal = (x, c) => {
    let y = Math.sin(x * 9 + c * 1.3) * 0.035 + Math.sin(x * 23 + c * 2.1) * 0.02 + Math.sin(x * 51 + c) * 0.01;
    for (const b of bursts) {
      const e = Math.exp(-((x - b.x) ** 2) / 0.006);
      y += e * Math.sin(x * b.f * 3 + c) * 0.07; // spindle
    }
    y += Math.exp(-((x - 0.35) ** 2) / 0.002) * -0.16 * (c % 2 ? 1 : 0.6); // K-complex
    return y;
  };
  const nHyp = Math.floor((N - nDust) * 0.14);
  const nSig = N - nDust - nHyp;
  for (let i = 0; i < nSig; i++) {
    const c = Math.floor(rng() * C);
    const t = rng();
    const x = -W / 2 + t * W;
    setPoint(buf, i, x, 0.95 - c * 0.3 + signal(t * 2 - 1, c) + gauss(rng) * 0.004, (c - C / 2) * 0.06, t);
  }
  // hypnogram: Wake / REM / N1 / N2 / N3 steps
  const stages = [0, 2, 3, 4, 4, 3, 1, 2, 3, 4, 3, 1, 1, 2, 3, 2, 1, 0];
  for (let i = 0; i < nHyp; i++) {
    const t = rng();
    const s = stages[Math.min(stages.length - 1, Math.floor(t * stages.length))];
    setPoint(buf, nSig + i, -W / 2 + t * W, -0.95 - s * 0.09 + gauss(rng) * 0.004, 0.1, t);
  }
  fillDust(buf, N - nDust, N, rng);
  return buf;
}

// ZTF transients — tilted two-arm spiral galaxy with a bright bulge and a
// few isolated "real" transients (the rest is bogus noise around it)
export function galaxy(N, rng) {
  const buf = makeBuffers(N);
  const nDust = Math.floor(N * 0.12);
  const nBulge = Math.floor(N * 0.14);
  const nTrans = Math.floor(N * 0.03);
  const nArms = N - nDust - nBulge - nTrans;
  const tilt = 1.05, ct = Math.cos(tilt), st = Math.sin(tilt);
  const put = (i, x, y, z, p) => setPoint(buf, i, x, y * ct - z * st, y * st + z * ct, p);
  for (let i = 0; i < nBulge; i++) {
    const r = Math.abs(gauss(rng)) * 0.16;
    const th = rng() * Math.PI * 2, ph = Math.acos(2 * rng() - 1);
    put(i, r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph) * 0.6, r);
  }
  for (let i = 0; i < nArms; i++) {
    const arm = rng() < 0.5 ? 0 : Math.PI;
    const t = Math.pow(rng(), 0.7);
    const r = 0.15 + t * 1.55;
    const th = arm + Math.log(r / 0.15) * 2.1 + gauss(rng) * (0.18 + t * 0.12);
    put(nBulge + i, Math.cos(th) * r + gauss(rng) * 0.03, Math.sin(th) * r + gauss(rng) * 0.03, gauss(rng) * 0.03, t);
  }
  const spots = Array.from({ length: 6 }, () => [(rng() - 0.5) * 2.6, (rng() - 0.5) * 1.6]);
  for (let i = 0; i < nTrans; i++) {
    const s = spots[i % spots.length];
    put(nBulge + nArms + i, s[0] + gauss(rng) * 0.02, s[1] + gauss(rng) * 0.02, gauss(rng) * 0.02, 1);
  }
  fillDust(buf, N - nDust, N, rng, 2.4);
  return buf;
}

// WAVE — a relativistic bunch with its electromagnetic wake trailing behind
// it as a rippling surface
export function wavefield(N, rng) {
  const buf = makeBuffers(N);
  const nDust = Math.floor(N * 0.03);
  const nBunch = Math.floor(N * 0.07);
  const bx = 1.25;
  for (let i = 0; i < nBunch; i++) {
    setPoint(buf, i, bx + gauss(rng) * 0.09, 0.15 + gauss(rng) * 0.035, gauss(rng) * 0.035, 0);
  }
  for (let i = nBunch; i < N - nDust; i++) {
    const x = -1.7 + rng() * 3.2;
    const z = (rng() - 0.5) * 2.0;
    const behind = Math.max(0, bx - x);
    const r = Math.hypot(behind * 0.6, z);
    const env = Math.exp(-Math.abs(z) * 1.6) * (behind > 0 ? 1 : Math.exp(-(x - bx) * 8));
    const y = -0.25 + Math.cos(behind * 7.5 - r * 1.5) * 0.28 * env * Math.exp(-behind * 0.25);
    const yy = y + gauss(rng) * 0.004;
    // tip the surface toward the camera so the ripples read
    setPoint(buf, i, x, yy * 0.85 - z * 0.53, yy * 0.53 + z * 0.85, Math.min(1, behind / 3));
  }
  fillDust(buf, N - nDust, N, rng);
  return buf;
}

// D-MT4SR — an item–relation graph: items as nodes, several relation types
// as edges, and one user's sequence threaded through it
export function graph(N, rng) {
  const buf = makeBuffers(N);
  const nDust = Math.floor(N * 0.04);
  const V = 46;
  const nodes = [];
  for (let i = 0; i < V; i++) {
    const th = rng() * Math.PI * 2, ph = Math.acos(2 * rng() - 1), r = 0.6 + rng() * 0.75;
    nodes.push([r * Math.sin(ph) * Math.cos(th) * 1.35, r * Math.sin(ph) * Math.sin(th) * 0.85, r * Math.cos(ph) * 0.7]);
  }
  const segs = [];
  for (let i = 0; i < V; i++) {
    const d = nodes.map((n, j) => [j, Math.hypot(n[0] - nodes[i][0], n[1] - nodes[i][1], n[2] - nodes[i][2])])
      .sort((a, b) => a[1] - b[1]).slice(1, 4);
    for (const [j] of d) if (j > i || rng() < 0.3) segs.push({ a: nodes[i], b: nodes[j], pa: rng(), pb: rng(), ra: 0.004 });
  }
  // the user's sequence: a thicker path hopping through nodes in order
  const seq = [];
  let cur = 0;
  for (let s = 0; s < 9; s++) {
    let best = -1, bd = 1e9;
    nodes.forEach((n, j) => {
      if (seq.includes(j) || j === cur) return;
      const d = Math.hypot(n[0] - nodes[cur][0], n[1] - nodes[cur][1], n[2] - nodes[cur][2]) + rng() * 0.4;
      if (d < bd) { bd = d; best = j; }
    });
    seq.push(cur); cur = best;
  }
  const seqSegs = [];
  for (let s = 0; s < seq.length - 1; s++) {
    seqSegs.push({ a: nodes[seq[s]], b: nodes[seq[s + 1]], pa: s / seq.length, pb: (s + 1) / seq.length, ra: 0.012 });
  }
  const nNodes = Math.floor((N - nDust) * 0.3);
  const per = Math.floor(nNodes / V);
  nodes.forEach((c, i) => {
    const big = seq.includes(i) ? 0.06 : 0.035;
    for (let k = 0; k < per; k++) setPoint(buf, i * per + k, c[0] + gauss(rng) * big, c[1] + gauss(rng) * big, c[2] + gauss(rng) * big, seq.includes(i) ? seq.indexOf(i) / seq.length : rng());
  });
  let idx = per * V;
  const nSeq = Math.floor((N - nDust) * 0.18);
  sampleSegments(buf, idx, nSeq, seqSegs, rng); idx += nSeq;
  sampleSegments(buf, idx, N - nDust - idx, segs, rng);
  fillDust(buf, N - nDust, N, rng);
  return buf;
}

// IEEE chatbot — sentence vectors as needles from the origin; the
// stored responses cluster by topic and one cluster sits on the query
export function sentences(N, rng) {
  const buf = makeBuffers(N);
  const nDust = Math.floor(N * 0.05);
  const topics = Array.from({ length: 6 }, () => {
    const th = rng() * Math.PI * 2, ph = Math.acos(2 * rng() - 1);
    return [Math.sin(ph) * Math.cos(th), Math.sin(ph) * Math.sin(th), Math.cos(ph)];
  });
  const query = topics[0];
  const segs = [];
  for (let v = 0; v < 90; v++) {
    const t = topics[v % topics.length];
    const len = 1.0 + rng() * 0.45;
    const d = [t[0] + gauss(rng) * 0.18, t[1] + gauss(rng) * 0.18, t[2] + gauss(rng) * 0.18];
    const l = Math.hypot(...d);
    const end = [d[0] / l * len * 1.2, d[1] / l * len * 0.85, d[2] / l * len * 0.7];
    const sim = (d[0] * query[0] + d[1] * query[1] + d[2] * query[2]) / l; // cosine to query
    segs.push({ a: [0, 0, 0], b: end, pa: 0, pb: 1 - (sim + 1) / 2, ra: 0.003, rb: 0.012 });
  }
  // the query vector itself: brighter, thicker
  const qEnd = [query[0] * 1.6, query[1] * 1.1, query[2] * 0.9];
  const nQ = Math.floor(N * 0.06);
  sampleSegments(buf, 0, nQ, [{ a: [0, 0, 0], b: qEnd, pa: 0, pb: 0, ra: 0.012, rb: 0.02 }], rng);
  sampleSegments(buf, nQ, N - nDust - nQ, segs, rng);
  fillDust(buf, N - nDust, N, rng);
  return buf;
}

// CUDA / NAND — a lattice of thread blocks (or flash pages), each a
// small cube of points; path follows the global index
export function lattice(N, rng) {
  const buf = makeBuffers(N);
  const nDust = Math.floor(N * 0.04);
  const BX = 10, BY = 6, BZ = 4, gap = 0.3;
  const total = BX * BY * BZ;
  for (let i = 0; i < N - nDust; i++) {
    const b = Math.floor(rng() * total);
    const bx = b % BX, by = Math.floor(b / BX) % BY, bz = Math.floor(b / (BX * BY));
    // points on cube edges read as crisp blocks
    const e = [rng(), rng(), rng()];
    const axis = Math.floor(rng() * 3);
    e[(axis + 1) % 3] = rng() < 0.5 ? 0 : 1;
    e[(axis + 2) % 3] = rng() < 0.5 ? 0 : 1;
    const s = 0.17;
    setPoint(buf, i,
      (bx - (BX - 1) / 2) * gap + (e[0] - 0.5) * s,
      (by - (BY - 1) / 2) * gap + (e[1] - 0.5) * s,
      (bz - (BZ - 1) / 2) * gap + (e[2] - 0.5) * s,
      b / total);
  }
  fillDust(buf, N - nDust, N, rng);
  return buf;
}

// Study Hub — a book fanned open: curved pages with lines of "text"
export function pages(N, rng) {
  const buf = makeBuffers(N);
  const nDust = Math.floor(N * 0.04);
  const P = 11, Wp = 1.35, Hp = 1.8, lines = 22;
  for (let i = 0; i < N - nDust; i++) {
    const p = Math.floor(rng() * P);
    const ang = -1.25 + (p / (P - 1)) * 2.5;
    let u = rng();
    // text lines with margins and ragged right edges
    const line = Math.floor(rng() * lines);
    const ragged = 0.55 + ((line * 7919 + p * 31) % 45) / 100;
    const isText = rng() < 0.82;
    if (isText) u = 0.1 + u * 0.8 * ragged;
    const v = isText ? 0.08 + (line / lines) * 0.84 + gauss(rng) * 0.003 : rng();
    const curl = Math.sin(u * Math.PI) * 0.12;
    const r = u * Wp;
    const a = ang + curl * 0.4;
    setPoint(buf, i, Math.sin(a) * r, (v - 0.5) * Hp, Math.cos(a) * r - 0.6 + curl * 0.2, p / P);
  }
  fillDust(buf, N - nDust, N, rng);
  return buf;
}

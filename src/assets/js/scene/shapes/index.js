// Shape registry. A project's `shape:` front matter picks one of these by
// name; anything unknown falls back to "embedding", so adding a project
// never requires touching code.

import { mulberry32 } from "./util.js";
import neuron from "./neuron.js";
import { column, mlp, attention, embedding } from "./story.js";
import { waveform, galaxy, wavefield, graph, sentences, lattice, pages } from "./projects.js";

const registry = {
  neuron, column, mlp, attention, embedding,
  waveform, galaxy, wavefield, graph, sentences, lattice, pages,
};

export const FALLBACK = "embedding";
export const STORY = ["neuron", "column", "mlp", "attention", "embedding"];

export function resolveShape(name) {
  return registry[name] ? name : FALLBACK;
}

const cache = new Map();

// Generated once per name per particle count, then reused
export function getShape(name, N) {
  const key = resolveShape(name);
  const id = `${key}:${N}`;
  if (!cache.has(id)) {
    // fixed seed per shape, so the sculpture looks the same on every visit
    const seed = [...key].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
    cache.set(id, registry[key](N, mulberry32(seed)));
  }
  return cache.get(id);
}

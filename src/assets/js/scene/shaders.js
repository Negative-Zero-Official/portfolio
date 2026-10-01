// Particle shaders.
//
// Vertex: morphs every point from aFrom → aTo with a per-particle stagger
// and a mid-flight scatter (so shapes dissolve and re-form rather than
// sliding), adds a slow drift, and pushes points away from the cursor.
// Fragment: a soft round dot in bone ink; an amber band — the "action
// potential" — sweeps along each structure's path attribute.

export const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uMorph;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uPulse;
  uniform vec3  uMouse;
  uniform float uMouseStrength;
  uniform float uQuery;

  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute float aPathFrom;
  attribute float aPathTo;
  attribute vec3 aRand;

  varying float vSpike;
  varying float vAlpha;
  varying float vQuery;

  float easeInOut(float t) { return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0; }

  void main() {
    // staggered morph: each particle starts at a slightly different time
    float t = clamp(uMorph * 1.5 - aRand.x * 0.5, 0.0, 1.0);
    float e = easeInOut(t);
    vec3 pos = mix(aFrom, aTo, e);
    float path = mix(aPathFrom, aPathTo, e);

    // mid-flight scatter, largest halfway through the morph
    float flight = sin(t * 3.14159);
    pos += (aRand - 0.5) * flight * 0.9;

    // slow organic drift
    float ph = aRand.y * 6.2831;
    pos += vec3(
      sin(uTime * 0.35 + ph + pos.y * 1.7),
      cos(uTime * 0.29 + ph * 1.3 + pos.x * 1.3),
      sin(uTime * 0.31 + ph * 0.7)
    ) * (0.006 + aRand.z * 0.008);

    vec4 world = modelMatrix * vec4(pos, 1.0);

    // cursor: push away (or, in query mode, pull toward and tint)
    vec2 d = world.xy - uMouse.xy;
    float dist = length(d);
    float falloff = smoothstep(0.75, 0.0, dist);
    vec2 dir = d / max(dist, 1e-4);
    world.xy += dir * falloff * uMouseStrength * 0.22 * (1.0 - uQuery * 1.6);
    vQuery = uQuery * smoothstep(0.55, 0.0, dist);

    vec4 mv = viewMatrix * world;
    gl_Position = projectionMatrix * mv;

    // action potential: a narrow band with a fading tail behind it
    float band = path - uPulse;
    vSpike = smoothstep(0.05, 0.0, abs(band)) + smoothstep(-0.22, 0.0, band) * step(band, 0.0) * 0.35;
    vSpike *= 1.0 - flight;

    float size = uSize * (0.55 + aRand.y * 0.75) * (1.0 + vSpike * 0.8 + vQuery * 0.8);
    gl_PointSize = size * uPixelRatio / -mv.z;

    // depth fade: points further back read fainter, like out-of-focus tissue
    vAlpha = clamp(1.25 - (-mv.z - 3.6) * 0.32, 0.25, 1.0);
  }
`;

export const fragmentShader = /* glsl */ `
  uniform vec3 uBone;
  uniform vec3 uStain;
  uniform float uOpacity;

  varying float vSpike;
  varying float vAlpha;
  varying float vQuery;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    if (r > 0.5) discard;
    float soft = smoothstep(0.5, 0.15, r);
    float glow = clamp(vSpike + vQuery, 0.0, 1.0);
    vec3 col = mix(uBone, uStain, glow);
    gl_FragColor = vec4(col, soft * vAlpha * uOpacity * (0.72 + glow * 0.28));
  }
`;

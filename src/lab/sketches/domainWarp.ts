/**
 * Sketch 3 — Domain Warp
 * 练什么：
 * - value noise + fbm
 * - domain warp：用噪声偏移采样坐标再画图案
 * - 层叠两三次 warp 出有机纹理（别一次叠十层）
 */
import type { SketchDef } from "./common";

export const domainWarp: SketchDef = {
  id: "domain-warp",
  label: "Domain Warp",
  tip: "练什么：noise 偏移 uv（domain warp）；fbm 叠 2–3 层即可",
  fragmentShader: /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uReducedMotion;

varying vec2 vUv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * valueNoise(p);
    p *= 2.02;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  vec2 pointer = (uPointer - 0.5) * vec2(aspect, 1.0);

  float motion = mix(1.0, 0.08, uReducedMotion);
  float t = uTime * 0.22 * motion;

  // Domain warp: offset the domain with fbm, then sample again
  vec2 q = p + pointer * 0.25;
  vec2 warp1 = vec2(
    fbm(q + vec2(0.0, t)),
    fbm(q + vec2(5.2, 1.3) - t)
  );
  vec2 warp2 = vec2(
    fbm(q + 1.8 * warp1 + vec2(1.7, 9.2) + 0.15 * t),
    fbm(q + 1.8 * warp1 + vec2(8.3, 2.8) - 0.12 * t)
  );

  float n = fbm(q + 2.4 * warp2);
  float ridges = 1.0 - abs(2.0 * n - 1.0);
  float bands = smoothstep(0.35, 0.75, ridges);

  vec3 deep = vec3(0.027, 0.063, 0.094);
  vec3 mid = vec3(0.08, 0.18, 0.2);
  vec3 cyan = vec3(0.361, 0.882, 0.902);
  vec3 lime = vec3(0.784, 0.961, 0.259);

  vec3 col = mix(deep, mid, n);
  col = mix(col, cyan * 0.75, bands * 0.65);
  col = mix(col, lime * 0.55, smoothstep(0.7, 0.95, ridges) * 0.45);
  col += cyan * 0.04 * motion;

  gl_FragColor = vec4(col, 1.0);
}
`,
};

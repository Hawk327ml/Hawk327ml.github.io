/**
 * Sketch 2 — SDF Soft Circle
 * 练什么：
 * - SDF：length(p - c) - r
 * - soft edge / outline 用 smoothstep
 * - 指针控制圆心，感受「场」而不是贴图
 */
import type { SketchDef } from "./common";

export const sdfCircle: SketchDef = {
  id: "sdf-circle",
  label: "SDF Circle",
  tip: "练什么：SDF = length(p-c)-r；描边用 abs(d) + smoothstep",
  fragmentShader: /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uReducedMotion;

varying vec2 vUv;

float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  vec2 pointer = (uPointer - 0.5) * vec2(aspect, 1.0);

  float motion = mix(1.0, 0.12, uReducedMotion);
  float radius = 0.22 + 0.03 * sin(uTime * 1.2 * motion);
  vec2 center = pointer * 0.85;

  float d = sdCircle(p - center, radius);
  float fill = 1.0 - smoothstep(0.0, 0.012, d);
  float stroke = 1.0 - smoothstep(0.0, 0.01, abs(d) - 0.008);
  float halo = exp(-8.0 * abs(d)) * 0.35;

  // Nested ring for readable SDF layers
  float d2 = sdCircle(p - center, radius * 0.55);
  float inner = 1.0 - smoothstep(0.0, 0.008, abs(d2));

  vec3 deep = vec3(0.027, 0.063, 0.094);
  vec3 field = vec3(0.05, 0.12, 0.14);
  vec3 cyan = vec3(0.361, 0.882, 0.902);
  vec3 lime = vec3(0.784, 0.961, 0.259);

  // Subtle grid so the signed field feels spatial
  vec2 g = abs(fract(p * 6.0) - 0.5);
  float grid = 1.0 - smoothstep(0.02, 0.03, min(g.x, g.y));

  vec3 col = mix(deep, field, 0.55 + 0.2 * grid);
  col = mix(col, cyan * 0.55, fill * 0.55);
  col = mix(col, lime, stroke * 0.95);
  col = mix(col, cyan, inner * 0.7);
  col += cyan * halo * motion;

  gl_FragColor = vec4(col, 1.0);
}
`,
};

/**
 * Sketch 2 — SDF Soft Circle + Dig
 * 成片记忆点：网格被指针掏成弹坑；SDF 圆钉在洞缘当「井口」。
 */
import type { SketchDef } from "./common";

export const sdfCircle: SketchDef = {
  id: "sdf-circle",
  label: "SDF Circle",
  tip: "记忆点：网格被挖成弹坑；SDF 圆钉在洞缘当井口",
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

  float motion = mix(1.0, 0.1, uReducedMotion);

  vec2 delta = p - pointer;
  float digDist = length(delta);
  float digPull = smoothstep(0.55, 0.0, digDist);
  vec2 digDir = delta / max(digDist, 1e-4);
  // Warp the sampling space into a crater bowl
  vec2 q = p + digDir * digPull * 0.28 * mix(1.0, 0.3, uReducedMotion);

  float radius = 0.16 + 0.025 * sin(uTime * 1.15 * motion);
  float d = sdCircle(q - pointer, radius);
  float fill = 1.0 - smoothstep(0.0, 0.012, d);
  float stroke = 1.0 - smoothstep(0.0, 0.009, abs(d) - 0.006);
  float hole = smoothstep(0.18, 0.0, digDist);
  float crater = smoothstep(0.018, 0.0, abs(digDist - 0.17));

  vec2 g = abs(fract((q + pointer * 0.15) * 7.0) - 0.5);
  float grid = 1.0 - smoothstep(0.018, 0.028, min(g.x, g.y));

  vec3 deep = vec3(0.02, 0.05, 0.07);
  vec3 field = vec3(0.05, 0.11, 0.13);
  vec3 voidCol = vec3(0.008, 0.012, 0.018);
  vec3 cyan = vec3(0.361, 0.882, 0.902);
  vec3 lime = vec3(0.784, 0.961, 0.259);

  vec3 col = mix(deep, field, 0.45 + 0.35 * grid);
  col = mix(col, cyan * 0.5, fill * 0.45);
  col = mix(col, lime, stroke * 0.95);
  col = mix(col, voidCol, hole * 0.9);
  col = mix(col, lime, crater * 0.9);
  col += cyan * crater * 0.25 * motion;

  gl_FragColor = vec4(col, 1.0);
}
`,
};

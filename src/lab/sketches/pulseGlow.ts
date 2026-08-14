/**
 * Sketch 1 — Pulse Glow + Dig
 * 成片记忆点：指针处挖出深井，边缘酸青描边；光场被洞「咬」开。
 * 仍练：vUv / uTime / smoothstep / uPointer。
 */
import type { SketchDef } from "./common";

export const pulseGlow: SketchDef = {
  id: "pulse-glow",
  label: "Pulse Glow",
  tip: "记忆点：拖鼠标挖洞——光场被洞咬开，洞缘酸青描边",
  fragmentShader: /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uReducedMotion;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  vec2 pointer = (uPointer - 0.5) * vec2(aspect, 1.0);

  float motion = mix(1.0, 0.12, uReducedMotion);

  // Dig warp: push domain outward from the pointer
  vec2 delta = p - pointer;
  float digDist = length(delta);
  float digPull = smoothstep(0.48, 0.0, digDist);
  vec2 digDir = delta / max(digDist, 1e-4);
  vec2 q = p + digDir * digPull * 0.22 * mix(1.0, 0.35, uReducedMotion);

  float pulse = 0.5 + 0.5 * sin(uTime * 1.55 * motion);
  float d = length(q);
  float glow = smoothstep(0.62 + 0.1 * pulse, 0.1, d);
  float ring = smoothstep(0.018, 0.0, abs(d - (0.3 + 0.05 * pulse)));

  float hole = smoothstep(0.2, 0.02, digDist);
  float crater = smoothstep(0.02, 0.0, abs(digDist - 0.14));

  vec3 deep = vec3(0.02, 0.05, 0.07);
  vec3 voidCol = vec3(0.01, 0.015, 0.02);
  vec3 cyan = vec3(0.361, 0.882, 0.902);
  vec3 lime = vec3(0.784, 0.961, 0.259);

  vec3 col = deep;
  col = mix(col, cyan * 0.9, glow * 0.88);
  col += lime * ring * 0.85;
  col += cyan * (0.05 / (d * d * 16.0 + 0.07)) * motion;

  // Carve the well + rim
  col = mix(col, voidCol, hole * 0.92);
  col = mix(col, lime, crater * 0.95);
  col += cyan * crater * 0.35;

  gl_FragColor = vec4(col, 1.0);
}
`,
};

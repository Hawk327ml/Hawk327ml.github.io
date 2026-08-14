/**
 * Sketch 1 — Pulse Glow
 * 练什么：
 * - vUv 到屏幕中心的距离
 * - uTime + sin 做呼吸
 * - uPointer 轻微拉扯光心
 * - uReducedMotion 压住动画幅度
 */
import type { SketchDef } from "./common";

export const pulseGlow: SketchDef = {
  id: "pulse-glow",
  label: "Pulse Glow",
  tip: "练什么：vUv + uTime 径向呼吸；指针轻轻拉光心",
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

  float motion = mix(1.0, 0.15, uReducedMotion);
  vec2 center = mix(vec2(0.0), pointer, 0.35);
  float d = length(p - center);

  float pulse = 0.5 + 0.5 * sin(uTime * 1.6 * motion);
  float glow = smoothstep(0.55 + 0.12 * pulse, 0.08, d);
  float ring = smoothstep(0.02, 0.0, abs(d - (0.28 + 0.06 * pulse)));

  vec3 deep = vec3(0.027, 0.063, 0.094);
  vec3 cyan = vec3(0.361, 0.882, 0.902);
  vec3 lime = vec3(0.784, 0.961, 0.259);

  vec3 col = deep;
  col = mix(col, cyan * 0.85, glow * 0.85);
  col += lime * ring * 0.9;
  col += cyan * (0.04 / (d * d * 18.0 + 0.08)) * motion;

  gl_FragColor = vec4(col, 1.0);
}
`,
};

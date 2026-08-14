# Shader Lab — GATE

> Live: `/lab/` · 片元着色器实验台（Three.js fullscreen quad）

## 成片验收

- [x] 第一视口品牌 `SHADER LAB` 可读
- [x] 一句说明：拖鼠标 + 1–3 切换 sketch
- [x] 全屏 shader（非 inset 卡片）
- [x] Sketch 1 Pulse Glow（vUv / time / pointer）
- [x] Sketch 2 SDF Soft Circle
- [x] Sketch 3 Domain Warp（value noise + fbm warp）
- [x] uniforms：`uTime` `uResolution` `uPointer` `uReducedMotion`
- [x] `prefers-reduced-motion` 减弱动画
- [x] 弱设备降低 pixel ratio

## 本周学到的 5 条

1. 全屏四边形只要把 `position.xy` 直接写成 clip-space，不必透视相机。
2. `vUv` 是 0..1；做圆形场时要乘 aspect，否则会椭圆。
3. SDF 圆：`length(p - c) - r`；描边看 `abs(d)`。
4. Domain warp = 用噪声偏移坐标，再拿偏移后的坐标去采样图案。
5. `uReducedMotion` 用 `mix` 压幅度，比直接 `if` 分支更稳。

## 口述检查

- [ ] 我能讲清 Pulse Glow 的 `smoothstep` 在干什么
- [ ] 我能在纸上写出 SDF 圆公式
- [ ] 我能解释 warp1 → warp2 → fbm 的两层偏移

## 下一步（Lab v2，别现在做）

- 更多 sketch / 简易代码面板
- 后处理 EffectComposer
- 录 15s 作品集封面

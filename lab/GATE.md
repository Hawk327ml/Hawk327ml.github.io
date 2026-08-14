# Shader Lab — GATE

> Live: `/lab/` · Featured · 记忆点：**指针挖洞**

## 成片验收（Featured）

- [x] 5 秒内：全屏在动 + 标题 SHADER LAB + 拖鼠标会挖洞
- [x] 洞缘酸青/石灰描边在三组 sketch 都成立
- [x] Sketch 1/2/3 可切换（按钮 + 数字键）
- [x] uniforms：`uTime` `uResolution` `uPointer` `uReducedMotion`
- [x] reduced-motion 减弱挖洞推力与动画
- [x] 弱设备降低 pixel ratio
- [x] 作品集 Selected + Featured + 15s 封面

## 本周学到的 5 条

1. 全屏四边形可直接写 clip-space，不必透视相机。
2. 圆形场要乘 aspect，否则会椭圆。
3. SDF 圆：`length(p-c)-r`；描边看 `abs(d)`。
4. Domain warp = 噪声偏移坐标后再采样。
5. 「挖洞」= 沿指针径向推开 domain + 中心压暗 + 洞缘描边。

## 口述检查（自学用）

- [ ] 讲清 digPull / digDir 在干什么
- [ ] 讲清 hole 与 crater 两层 mask 的差别
- [ ] 换 sketch 后仍能指着画面说「洞在哪」

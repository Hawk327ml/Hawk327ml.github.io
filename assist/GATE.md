# Vision Assist Lab — Rebuild Gate

## 当前状态

- **成片已解锁并实现**（口令：`开做画面`）
- `/assist/`：可玩 40s 局 + Worker 检测框 + Assist 开关 + 结算分享
- Selected Work + Featured（作品集卡片已接入）

## 口令（历史）

```text
开做画面
```

已执行顺序：

1. Canvas 2D 可玩局 + HUD  
2. Worker 视觉检测（game-matched blob CV）+ IoU tracker  
3. Assist On/Off、结算、share、boot/coach  
4. 弱设备隔帧 + reduced-motion  
5. OG + `projects.ts` Featured  

## 成片验收

- [x] 5 秒内知道：有检测框 + 能玩 + Assist 可关  
- [x] 关辅助仍可完整一局  
- [x] 手机竖屏可点可懂  
- [x] disclaimer 可见；非 aimbot 叙事  
- [x] `prefers-reduced-motion` 下无狂闪辅助描边  

## 测量（成片）

| 项 | 记录 |
|----|------|
| 视觉后端 | ONNX nano（`drone-nano.onnx`）+ blob fallback |
| 模型体积 | ~85KB ONNX；ORT WASM 构建时注入 `/ort/`（不进 git） |
| debug | `/assist/?debug=1` → `backend: ONNX nano` |

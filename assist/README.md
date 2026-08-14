# Vision Assist Lab

自制射击小关卡 + **浏览器端 ONNX 视觉检测 HUD**（GitHub Pages）。

**Live:** https://hawk327ml.github.io/assist/  
**Docs:** [DESIGN.md](./DESIGN.md) · [SPEC.md](./SPEC.md) · [GATE.md](./GATE.md)

## What you can do

- 40 秒一局：点击射击橙 / 青无人机
- Worker 跑 **ONNX nano**（合成数据训练的轻量热力图检测）并画框
- 失败自动回退 **color-blob CV**
- **Assist On/Off**：开时软吸附最近检测目标（仅本 demo）
- 结算、最佳分、分享文案

## What this is not

商业游戏瞄准、桌面截屏、鼠标注入。页内有 disclaimer。

## Vision backend

| 层 | 说明 |
|----|------|
| Primary | `drone-nano.onnx` via `onnxruntime-web`（~85KB 权重） |
| Fallback | Worker color-blob（匹配高对比目标） |
| Tracker | IoU 短窗稳定框 |

重训：`npm run train:assist-detector`

## Run

```bash
npm install
npm run dev
```

Open `/assist/`（`?debug=1` 看 backend / det FPS）。

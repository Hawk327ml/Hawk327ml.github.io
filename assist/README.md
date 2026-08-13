# Vision Assist Lab

自制射击小关卡 + **浏览器端视觉检测 HUD**（GitHub Pages）。

**Live:** https://hawk327ml.github.io/assist/  
**Docs:** [DESIGN.md](./DESIGN.md) · [SPEC.md](./SPEC.md) · [GATE.md](./GATE.md)

## What you can do

- 40 秒一局：点击射击橙 / 青无人机
- 端侧 Worker 对 **自有 Canvas** 做检测并画框
- **Assist On/Off**：开时软吸附最近检测目标（仅本 demo）
- 结算、最佳分、分享文案

## What this is not

商业游戏瞄准、桌面截屏、鼠标注入。页内有 disclaimer。

## Vision backend

Game-matched **color-blob CV** in a Web Worker（与高对比目标艺术一致）+ IoU tracker。消息协议预留 ONNX/TF.js 替换（见 SPEC）。

## Run

```bash
npm install
npm run dev
```

Open `/assist/`（`?debug=1` 看 det FPS）。

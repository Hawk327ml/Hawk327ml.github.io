# PULSEFIELD — Spec Sheet (Phase 2 · LOCKED)

> Motif: **Ring Stage**（见 DESIGN.md）  
> Rebuild: 仅在用户明确「开做画面」后执行（见 GATE.md）

## One-screen wireframe

### Rest

```
[← HAWK]     PULSEFIELD      [A] [音量]

     点 Play，环形舞台跟着音乐呼吸。
              [ PLAY ]
```

### Playing

```
[← HAWK]     PULSEFIELD      [A] [音量]

        （全屏环形舞台跟拍）

     跟随中 · Pulse A          [PAUSE]
```

Meters: hidden unless `?debug=1`.

## Band → visual binding（每个 band ≤ 2 attrs）

| Band | Hz (approx) | Visual |
|------|-------------|--------|
| bass | 20–140 | 主环 scale；相机 Z 轻推 |
| mid | 140–2000 | 主环 twist / 分段高度起伏 |
| high | 2000–12000 | 边缘 spark opacity/size |
| beat | bass onset | 单次 scale kick（衰减） |

## Analysis contract（保留）

- `fftSize`: 2048（lean: 1024）
- Smooth: attack fast / release slow → `{ bass, mid, high, beat }` ∈ 0..1
- rAF 读 band；与 Audio 时钟解耦

## Performance budget

| Target | Value |
|--------|-------|
| Desktop | 60 fps |
| Mid phone | 30 fps+ |
| DPR | ≤ 1.25 lean / ≤ 2 desktop |
| Ring segments | ≤ 96 |
| Sparks | ≤ 120（lean 48） |
| reduced-motion | 音频可播；几何跟拍冻结或极弱 |

## Audio strategy

| Phase | Track | Note |
|-------|-------|------|
| Draft / gate | `pulse-a.wav` / `pulse-b.wav` | 自合成 placeholder，仅测分析 |
| Ship | 替换为可合法展示的短曲（CC0 / 自制），更新 [CREDITS](../public/audio/CREDITS.md) | 禁止无授权流行歌 |

## Out of scope (v1)

- 麦克风、文件上传、在线曲库
- 歌词同步、复杂拍号 AI
- 多场景切换、开放世界

## Fallback

- No WebGL: 静态品牌 + Play + CSS 呼吸条
- Tab hidden: 停重渲染；音频随用户 Pause 状态

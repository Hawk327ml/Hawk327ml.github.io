# PULSEFIELD — Design Note (Phase 0 · LOCKED)

> Status: **SHIPPED**（Ring Stage）  
> Selected Work + Featured；音轨为自制可展示循环。

## Positioning（已锁定）

**One-liner:** 点 Play，整块环形舞台跟着音乐呼吸。

**Tagline (portfolio, 成片后用):** 环形脉冲舞台 · 频谱驱动 · 点 Play 即跟拍。

**5 秒认知目标:** 陌生人进页只看到品牌 + 一句 + Play；播放后仍知道「音乐在驱动舞台」，而不是调试器。

## Visual motif（已锁定）

**环形脉冲舞台（Ring Stage）** — 唯一母题。

- 全出血暗场舞台；中央主环 + 可控附属环/台面光，不做开放世界、不做柱林、不做网格主视觉
- bass → 舞台冲击尺度 / 轻微相机推近
- mid → 环带扭转与分段起伏
- high → 舞台边缘细光点闪烁（克制）
- beatPulse → 单次 kick（阈值）

## Brand tokens

| Token | Value |
|-------|-------|
| Name | PULSEFIELD |
| Accent | `#3EE0B8` |
| Accent 2 | `#F0A35E` |
| Ink | `#E8F0EE` |
| Bg deep | `#0B1214` |
| Bg mid | `#152026` |
| Forbidden | purple neon defaults, multi-layer glow stacks, pill clusters, emoji, debug meter walls |

## One-screen IA（已锁定）

### Resting

- Top: ← HAWK · PULSEFIELD ·（曲目/音量可极简）
- Center: 一句文案 + **PLAY**
- No meters

### Playing

- Brand 常驻顶部
- Center CTA 可收起，但保留一句短状态（如曲名或「跟随中」）——**禁止整块叙事蒸发只剩转环**
- Controls: Pause / 切曲 / 静音
- Meters: **默认隐藏**（仅 `?debug=1` 显示）

## References（气质，可实现）

1. Three.js audio examples — MediaElement + Analyser 管线
2. Minimal ring-spectrum stages（单焦点环形）
3. 本站作品集一屏预算（品牌英雄级 + 单 CTA + 单画面）

## Input policy

Track-first。麦克风 / 上传 / 歌词 = 首版不做。

## Keep vs Rewrite

| Keep | Rewrite before ship |
|------|---------------------|
| `src/pulse/audio.ts` 分析契约 | `scene.ts` 与成片 HUD 叙事 |
| `public/audio/*` 可作 placeholder | 正式可展示音轨（若合成轨气质不够） |
| `/pulse` 路由与多页构建 | Featured 卡片与英雄 CTA（成片后再挂） |

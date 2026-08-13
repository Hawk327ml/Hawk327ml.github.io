# Vision Assist Lab — Design Note (Phase 0)

> Status: **SHIPPED**（口令「开做画面」后成片）  
> Selected Work + Featured；Live `/assist/`。

## Positioning（锁定）

**One-liner:** 在一局自制小游戏里，用浏览器端目标检测实时画出目标框与辅助提示，让人 5 秒看懂：检测 → 辅助 → 分数。

**Tagline (portfolio, 成片后用):** 自研小关卡 + 端侧视觉辅助 HUD · 非商业游戏作弊工具。

**5 秒认知目标:** 陌生人进页立刻看到目标被框住 + 一句可读提示（如「优先打近的」）+ 自己仍能上手玩；明白这是 **demo 管线**，不是帮打 Valorant。

## Ethics / 合规（锁定）

| 允许 | 禁止 |
|------|------|
| 只分析本页自有 Canvas 像素 | 截取第三方游戏窗口 / 桌面 |
| 可选「辅助高亮」仅影响自有 demo | 自动开火、自动瞄准、注入鼠标 |
| 页内 + README disclaimer | 无说明、起 aimbot 式营销名 |
| 弱设备可关检测仍可玩 | 无 WebGPU 就白屏 |

**对外叙事关键词：** Vision Coach / Assist Lab / detection HUD。  
**避免关键词：** aimbot、triggerbot、反作弊绕过。

## Visual motif（锁定）

**检测叠层 HUD** — 唯一母题。

- 深色竞技场 + 清晰可检目标（高对比色块/剪影，降低模型难度）
- 青绿检测框 + 置信度微标（克制，默认不超过 3 个并发标注细节）
- 辅助开时：最近目标描边加亮；关时：仅画框或完全静默
- Forbidden：紫霓虹默认、多层 glow、pill 集群、emoji、调试器墙式 meters（meters 仅 `?debug=1`）

## Brand tokens

| Token | Value |
|-------|-------|
| Name | Vision Assist Lab |
| Path | `/assist/` |
| Accent | `#5CE1E6` |
| Accent 2 | `#C8F542` |
| Warn | `#F45B69` |
| Ink | `#E8F0E6` |
| Bg deep | `#0B0F0C` |
| Bg mid | `#121812` |

与 HAWK 作品集暗底酸青一致，与 Orb 橙、PULSE 薄荷绿区分。

## One-screen IA（成片时）

### Boot / Model load

- Brand + one-liner + 加载进度（模型/探针引擎）
- 短 disclaimer 一行可点开详情

### Playing

- Top: ← HAWK · Vision Assist Lab · Assist On/Off
- Center: 游戏画面（主视觉）
- Overlay: 检测框（不挡准星/操作核心区）
- Corner status: 一句 coach（非 meters 墙）
- Debug meters: 仅 `?debug=1`（det FPS / conf / backend）

### Result

- 命中率、辅助开/关对比一句、Share、回作品集

## Input policy

- 指针 / 触控优先；键盘可选
- 第一版不做摄像头、不做桌面截屏、不做 LLM 解说

## References（气质）

1. 本站 Orb Courier — boot / coach / lean / share / reduced-motion
2. PULSEFIELD GATE — 口令解锁成片
3. 教练 overlay 产品感（框 + 提示），非 aimbot 仓库

## Probe scope（本阶段）

见 [GATE.md](./GATE.md)：只验证 `canvas → Worker → boxes`，不做完整玩法。

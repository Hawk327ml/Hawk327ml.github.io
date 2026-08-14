# Shader Lab — Design Note

## Positioning

**One-liner:** 拖鼠标挖洞改场的片元着色器实验台。

**5 秒认知:** 指针所到之处出现深井与洞缘；切换 sketch 洞还在。

## Visual motif

暗底酸青场 + **挖洞井口（void + lime rim）** 为唯一记忆点。

| Token | Value |
|-------|-------|
| Bg deep | `#071018` |
| Ink | `#E8F0E6` |
| Accent cyan | `#5CE1E6` |
| Accent lime | `#C8F542` |
| Display | Bebas Neue |
| Body | Manrope |

Forbidden：紫霓虹默认、多层 glow 堆、pill 集群、emoji、仪表墙。

## IA

- Top：← HAWK · FRAGMENT STAGE · GATE
- Hero：品牌 + 一句操作说明（不挡中心场）
- Bottom：sketch 切换 + Tip（当前在练什么）

## Input

- 指针 / 触控移动 → `uPointer`
- 键盘 `1` `2` `3` / 按钮 → 切换 sketch

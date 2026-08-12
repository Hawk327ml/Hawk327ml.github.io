# PULSEFIELD

**Status: SHIPPED** — Ring Stage · track-first audio reactive stage.

点 Play，环形舞台跟着音乐呼吸。

## Docs

- [DESIGN.md](./DESIGN.md) — motif & IA
- [SPEC.md](./SPEC.md) — band bindings & budgets
- [GATE.md](./GATE.md) — rebuild / ship gate
- [Audio credits](../public/audio/CREDITS.md)

## Local

```bash
npm run dev
```

Open http://localhost:5173/pulse/

Meters: append `?debug=1`.

## Stack

- `src/pulse/audio.ts` — Web Audio band pipeline
- `src/pulse/scene.ts` — Ring Stage
- `src/pulse/main.ts` — HUD state

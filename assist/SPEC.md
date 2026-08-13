# Vision Assist Lab — SPEC (Phase 0)

> Companion to [DESIGN.md](./DESIGN.md). Prep + probe architecture. Full game modules land after GATE unlock.

## Goals

1. Prove a **transferable detection pipeline**: game canvas frames → Worker → tracked boxes → HUD.
2. Keep **playable fallback** if detection is slow or unavailable.
3. Stay deployable on **GitHub Pages MPA** (same repo as Orb / PULSE).

## Non-goals (Phase 0 / v1)

- Desktop screen capture, OBS hooks, mouse injection
- Commercial game models / aimbot UX
- R3F / heavy Three scene for the mini-game (Canvas 2D first)
- LLM coaching narration

## Module map (target)

| Module | Path (planned) | Responsibility |
|--------|----------------|----------------|
| Shell | `assist/index.html` | Boot, disclaimer, HUD slots, canvas hosts |
| Loader | `src/assist/main.ts` | Dynamic import, fail UI, `?debug=1` |
| Game | `src/assist/game.ts` | Tick, spawn, input, score (post-GATE) |
| Detect worker | `src/assist/detect/worker.ts` | Preprocess, infer, NMS |
| Tracker | `src/assist/detect/tracker.ts` | Short-window IoU track to reduce jitter |
| HUD | `src/assist/hud.ts` | Boxes, coach line, assist toggle |
| Probe page | `assist/index.html` (Phase 0) | Synthetic targets + worker boxes + FPS log |

**Rule:** detection and gameplay never share one monolith file.

## Data flow

```text
rAF (main)
  → draw game/probe into #game-canvas
  → createImageBitmap(canvas)  [or downscaled OffscreenCanvas]
  → postMessage({ type:"frame", bitmap, t }, [bitmap])
Worker
  → ImageData / resize
  → detect() → raw boxes {x,y,w,h,score,label}
  → light NMS
  → postMessage({ type:"det", boxes, inferMs, t })
Main
  → tracker.update(boxes)
  → hud.draw(tracked)
  → (optional) assist highlight nearest
```

Main thread never blocks on inference; drop frames if worker is busy (`inFlight` gate).

## Probe detector (Phase 0)

To validate architecture **without** shipping a multi‑MB model on day one:

- Synthetic orange/cyan blobs on canvas (known HSV ranges)
- Worker runs **color-blob detection** on ImageData (connected components / centroid boxes)
- Same message protocol as future ONNX/TF.js backend (`type: "det"`)

Swap path (post-GATE): replace `detectColorBlobs` with ONNX Runtime Web / TF.js nano model; keep tracker + HUD.

## Performance budget

| Metric | Target (desktop Chrome) | Lean / mobile |
|--------|-------------------------|---------------|
| Detection input | ≤ 320 px long side | ≤ 256 px |
| Infer cadence | every 2nd frame (≥ ~15 det FPS when rAF=60) | every 3rd–4th frame |
| Main rAF | 60 when possible | 30 ok |
| Cold start to first box | ≤ 2 s (probe) | ≤ 5 s |
| Failure | Assist Off, game still runs | same |

`prefers-reduced-motion`: keep detection; reduce HUD pulse/animations only.

## Message protocol (Worker ↔ Main)

```ts
// main → worker
{ type: "init" }
{ type: "frame"; bitmap: ImageBitmap; t: number; maxSide: number }

// worker → main
{ type: "ready" }
{ type: "det"; t: number; inferMs: number; boxes: Box[] }
{ type: "error"; message: string }

type Box = { x: number; y: number; w: number; h: number; score: number; label: string };
// x,y,w,h normalized 0..1 relative to full canvas
```

## Vite / deploy

- Register `assist: assist/index.html` in `vite.config.ts` `build.rollupOptions.input`
- Keep `modulePreload: false` (same rationale as Orb / three chunk)
- Live path after ship: `https://hawk327ml.github.io/assist/`
- Portfolio card only after GATE pass（本阶段不改 `projects.ts` Featured）

## Security / privacy

- No camera permission in Phase 0 / v1 default
- No network calls from worker except future optional model CDN (document source)
- Pixels never leave the device for probe path

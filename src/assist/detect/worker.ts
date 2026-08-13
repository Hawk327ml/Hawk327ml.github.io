/// <reference lib="webworker" />

import type { Box, MainToWorker, WorkerToMain } from "./types";

declare const self: DedicatedWorkerGlobalScope;

type BlobSeed = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  count: number;
  label: string;
};

function post(msg: WorkerToMain) {
  self.postMessage(msg);
}

/** Game-matched vision: high-contrast orange/cyan targets (DESIGN). */
function isOrange(r: number, g: number, b: number) {
  return r > 180 && g > 70 && g < 180 && b < 90 && r > g && r - b > 80;
}

function isCyan(r: number, g: number, b: number) {
  return b > 150 && g > 140 && r < 120 && g + b > 320;
}

function detectColorBlobs(image: ImageData): Box[] {
  const { data, width, height } = image;
  const visited = new Uint8Array(width * height);
  const boxes: Box[] = [];
  const idx = (x: number, y: number) => y * width + x;

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const i = idx(x, y);
      if (visited[i]) continue;
      const p = i * 4;
      const r = data[p];
      const g = data[p + 1];
      const b = data[p + 2];
      let label: string | null = null;
      if (isOrange(r, g, b)) label = "drone-orange";
      else if (isCyan(r, g, b)) label = "drone-cyan";
      if (!label) continue;

      const seed: BlobSeed = {
        minX: x,
        minY: y,
        maxX: x,
        maxY: y,
        count: 0,
        label,
      };
      const stack = [i];
      visited[i] = 1;

      while (stack.length) {
        const cur = stack.pop()!;
        const cx = cur % width;
        const cy = (cur / width) | 0;
        const cp = cur * 4;
        const match =
          label === "drone-orange"
            ? isOrange(data[cp], data[cp + 1], data[cp + 2])
            : isCyan(data[cp], data[cp + 1], data[cp + 2]);
        if (!match) continue;

        seed.count += 1;
        seed.minX = Math.min(seed.minX, cx);
        seed.minY = Math.min(seed.minY, cy);
        seed.maxX = Math.max(seed.maxX, cx);
        seed.maxY = Math.max(seed.maxY, cy);

        for (const [nx, ny] of [
          [cx - 2, cy],
          [cx + 2, cy],
          [cx, cy - 2],
          [cx, cy + 2],
        ] as const) {
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const ni = idx(nx, ny);
          if (visited[ni]) continue;
          visited[ni] = 1;
          stack.push(ni);
        }
      }

      if (seed.count < 18) continue;
      const bw = seed.maxX - seed.minX + 1;
      const bh = seed.maxY - seed.minY + 1;
      boxes.push({
        x: seed.minX / width,
        y: seed.minY / height,
        w: bw / width,
        h: bh / height,
        score: Math.min(0.99, 0.55 + seed.count / 800),
        label: seed.label,
      });
    }
  }

  return boxes;
}

function downscale(bitmap: ImageBitmap, maxSide: number): OffscreenCanvas {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("OffscreenCanvas 2D unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas;
}

self.onmessage = (event: MessageEvent<MainToWorker>) => {
  const msg = event.data;
  try {
    if (msg.type === "init") {
      post({ type: "ready" });
      return;
    }
    if (msg.type === "frame") {
      const t0 = performance.now();
      const canvas = downscale(msg.bitmap, msg.maxSide);
      msg.bitmap.close();
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("OffscreenCanvas 2D unavailable");
      const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const boxes = detectColorBlobs(image);
      post({ type: "det", t: msg.t, inferMs: performance.now() - t0, boxes });
    }
  } catch (err) {
    post({
      type: "error",
      message: err instanceof Error ? err.message : String(err),
    });
  }
};

/// <reference lib="webworker" />

import * as ort from "onnxruntime-web/wasm";
import type { Box, MainToWorker, WorkerToMain } from "./types";

declare const self: DedicatedWorkerGlobalScope;

const MODEL_INPUT = 160;
const GRID = 20;
const SCORE_TH = 0.42;
const LABELS = ["background", "drone-orange", "drone-cyan"] as const;

type Backend = "onnx" | "blob";

type BlobSeed = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  count: number;
  label: string;
};

let session: ort.InferenceSession | null = null;
let backend: Backend = "blob";

function post(msg: WorkerToMain) {
  self.postMessage(msg);
}

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

function imageToTensor(image: ImageData): ort.Tensor {
  const { data, width, height } = image;
  const out = new Float32Array(3 * MODEL_INPUT * MODEL_INPUT);
  // nearest resize RGBA → CHW float 0..1
  for (let y = 0; y < MODEL_INPUT; y++) {
    const sy = Math.min(height - 1, Math.floor((y / MODEL_INPUT) * height));
    for (let x = 0; x < MODEL_INPUT; x++) {
      const sx = Math.min(width - 1, Math.floor((x / MODEL_INPUT) * width));
      const si = (sy * width + sx) * 4;
      const di = y * MODEL_INPUT + x;
      out[di] = data[si] / 255;
      out[MODEL_INPUT * MODEL_INPUT + di] = data[si + 1] / 255;
      out[2 * MODEL_INPUT * MODEL_INPUT + di] = data[si + 2] / 255;
    }
  }
  return new ort.Tensor("float32", out, [1, 3, MODEL_INPUT, MODEL_INPUT]);
}

function softmax3(a: number, b: number, c: number): [number, number, number] {
  const m = Math.max(a, b, c);
  const ea = Math.exp(a - m);
  const eb = Math.exp(b - m);
  const ec = Math.exp(c - m);
  const s = ea + eb + ec;
  return [ea / s, eb / s, ec / s];
}

function decodeHeatmap(logits: Float32Array, shape: readonly number[]): Box[] {
  // NCHW: [1, 3, H, W]
  const h = shape[2] ?? GRID;
  const w = shape[3] ?? GRID;
  const plane = h * w;
  const boxes: Box[] = [];
  const taken = new Uint8Array(plane);

  for (const cls of [1, 2] as const) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (taken[i]) continue;
        const l0 = logits[i];
        const l1 = logits[plane + i];
        const l2 = logits[2 * plane + i];
        const probs = softmax3(l0, l1, l2);
        const score = probs[cls];
        if (score < SCORE_TH) continue;

        // local max 3x3
        let isMax = true;
        for (let dy = -1; dy <= 1 && isMax; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            const ni = ny * w + nx;
            const nprobs = softmax3(logits[ni], logits[plane + ni], logits[2 * plane + ni]);
            if (nprobs[cls] > score) {
              isMax = false;
              break;
            }
          }
        }
        if (!isMax) continue;

        // suppress neighborhood
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            taken[ny * w + nx] = 1;
          }
        }

        const cx = (x + 0.5) / w;
        const cy = (y + 0.5) / h;
        const size = 0.07 + score * 0.04;
        boxes.push({
          x: Math.max(0, cx - size / 2),
          y: Math.max(0, cy - size / 2),
          w: Math.min(1 - Math.max(0, cx - size / 2), size),
          h: Math.min(1 - Math.max(0, cy - size / 2), size),
          score,
          label: LABELS[cls],
        });
      }
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

async function initOnnx(): Promise<boolean> {
  try {
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.proxy = false;
    ort.env.wasm.wasmPaths = "/ort/";
    const modelUrl = new URL("/assist/models/drone-nano.onnx", self.location.origin).href;
    session = await ort.InferenceSession.create(modelUrl, {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
    });
    backend = "onnx";
    return true;
  } catch (err) {
    console.warn("[assist] ONNX init failed, using blob fallback", err);
    session = null;
    backend = "blob";
    return false;
  }
}

async function detectOnnx(image: ImageData): Promise<Box[]> {
  if (!session) return detectColorBlobs(image);
  const input = imageToTensor(image);
  const out = await session.run({ input });
  const tensor = out.logits ?? Object.values(out)[0];
  if (!tensor) return detectColorBlobs(image);
  const data = tensor.data as Float32Array;
  return decodeHeatmap(data, tensor.dims);
}

self.onmessage = (event: MessageEvent<MainToWorker>) => {
  const msg = event.data;
  void (async () => {
    try {
      if (msg.type === "init") {
        await initOnnx();
        post({ type: "ready", backend });
        return;
      }
      if (msg.type === "frame") {
        const t0 = performance.now();
        const side = backend === "onnx" ? MODEL_INPUT : msg.maxSide;
        const canvas = downscale(msg.bitmap, side);
        msg.bitmap.close();
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("OffscreenCanvas 2D unavailable");
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const boxes =
          backend === "onnx" ? await detectOnnx(image) : detectColorBlobs(image);
        post({
          type: "det",
          t: msg.t,
          inferMs: performance.now() - t0,
          boxes,
          backend,
        });
      }
    } catch (err) {
      post({
        type: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  })();
};

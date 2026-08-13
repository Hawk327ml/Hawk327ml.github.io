export type Box = {
  x: number;
  y: number;
  w: number;
  h: number;
  score: number;
  label: string;
  id?: number;
};

export type MainToWorker =
  | { type: "init" }
  | { type: "frame"; bitmap: ImageBitmap; t: number; maxSide: number };

export type WorkerToMain =
  | { type: "ready" }
  | { type: "det"; t: number; inferMs: number; boxes: Box[] }
  | { type: "error"; message: string };

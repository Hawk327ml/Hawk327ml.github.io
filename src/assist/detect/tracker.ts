import type { Box } from "./types";

type Track = Box & { id: number; age: number; hits: number };

function iou(a: Box, b: Box): number {
  const ax2 = a.x + a.w;
  const ay2 = a.y + a.h;
  const bx2 = b.x + b.w;
  const by2 = b.y + b.h;
  const ix = Math.max(0, Math.min(ax2, bx2) - Math.max(a.x, b.x));
  const iy = Math.max(0, Math.min(ay2, by2) - Math.max(a.y, b.y));
  const inter = ix * iy;
  const uni = a.w * a.h + b.w * b.h - inter;
  return uni > 0 ? inter / uni : 0;
}

/** Short-window IoU tracker to reduce box flicker. */
export function createTracker(iouThresh = 0.25, maxAge = 8) {
  let nextId = 1;
  let tracks: Track[] = [];

  return {
    update(detections: Box[]): Box[] {
      const unmatched = new Set(detections.map((_, i) => i));
      const updated: Track[] = [];

      for (const track of tracks) {
        let bestI = -1;
        let best = 0;
        for (const i of unmatched) {
          const d = detections[i];
          if (d.label !== track.label) continue;
          const v = iou(track, d);
          if (v > best) {
            best = v;
            bestI = i;
          }
        }
        if (bestI >= 0 && best >= iouThresh) {
          const d = detections[bestI];
          unmatched.delete(bestI);
          updated.push({
            ...d,
            id: track.id,
            age: 0,
            hits: track.hits + 1,
          });
        } else if (track.age + 1 <= maxAge) {
          updated.push({ ...track, age: track.age + 1, score: track.score * 0.92 });
        }
      }

      for (const i of unmatched) {
        const d = detections[i];
        updated.push({ ...d, id: nextId++, age: 0, hits: 1 });
      }

      tracks = updated;
      return tracks.map(({ id, x, y, w, h, score, label }) => ({
        id,
        x,
        y,
        w,
        h,
        score,
        label,
      }));
    },
    reset() {
      tracks = [];
      nextId = 1;
    },
  };
}

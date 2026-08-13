import type { Box } from "./detect/types";

export type GameStats = {
  hits: number;
  misses: number;
  score: number;
  assistOn: boolean;
  durationSec: number;
};

export type GameHooks = {
  getBoxes: () => Box[];
  getAssistOn: () => boolean;
  onRoundEnd: (stats: GameStats) => void;
  reducedMotion: boolean;
};

type Drone = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  label: "orange" | "cyan";
  alive: boolean;
};

const ROUND_SEC = 40;
const BEST_KEY = "vision-assist-lab-best";

export function createGame(
  canvas: HTMLCanvasElement,
  overlay: HTMLCanvasElement,
  hooks: GameHooks,
) {
  const gctx = canvas.getContext("2d");
  const octx = overlay.getContext("2d");
  if (!gctx || !octx) throw new Error("2D context unavailable");

  const pointer = { x: 0.5, y: 0.5, down: false };
  let drones: Drone[] = [];
  let hits = 0;
  let misses = 0;
  let score = 0;
  let started = false;
  let ended = false;
  let timeLeft = ROUND_SEC;
  let spawnAcc = 0;
  let flash = 0;
  let coachLine = "移动准星，点击射击橙/青无人机";
  let running = false;
  let last = performance.now();
  let raf = 0;

  function resetDrones() {
    drones = [
      { x: 0.2, y: 0.3, r: 0.05, vx: 0.11, vy: 0.07, label: "orange", alive: true },
      { x: 0.7, y: 0.45, r: 0.06, vx: -0.09, vy: 0.1, label: "cyan", alive: true },
      { x: 0.45, y: 0.7, r: 0.045, vx: 0.13, vy: -0.08, label: "orange", alive: true },
    ];
  }

  function spawnDrone() {
    const label = Math.random() > 0.45 ? "orange" : "cyan";
    drones.push({
      x: 0.15 + Math.random() * 0.7,
      y: 0.15 + Math.random() * 0.7,
      r: 0.04 + Math.random() * 0.025,
      vx: (Math.random() > 0.5 ? 1 : -1) * (0.08 + Math.random() * 0.1),
      vy: (Math.random() > 0.5 ? 1 : -1) * (0.08 + Math.random() * 0.1),
      label,
      alive: true,
    });
  }

  function nearestBox(boxes: Box[]): Box | null {
    let best: Box | null = null;
    let bestD = Infinity;
    for (const b of boxes) {
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      const d = (cx - pointer.x) ** 2 + (cy - pointer.y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = b;
      }
    }
    return best;
  }

  function aimPoint(): { x: number; y: number } {
    const assist = hooks.getAssistOn();
    if (!assist) return { x: pointer.x, y: pointer.y };
    const box = nearestBox(hooks.getBoxes());
    if (!box) return { x: pointer.x, y: pointer.y };
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    const dist = Math.hypot(cx - pointer.x, cy - pointer.y);
    if (dist > 0.18) return { x: pointer.x, y: pointer.y };
    // Soft snap toward nearest detection (own demo only)
    const t = Math.min(1, 0.55);
    return {
      x: pointer.x + (cx - pointer.x) * t,
      y: pointer.y + (cy - pointer.y) * t,
    };
  }

  function tryShoot() {
    if (!started || ended) return;
    const aim = aimPoint();
    let hit = false;
    for (const d of drones) {
      if (!d.alive) continue;
      if (Math.hypot(d.x - aim.x, d.y - aim.y) <= d.r * 1.15) {
        d.alive = false;
        hit = true;
        hits += 1;
        score += d.label === "cyan" ? 120 : 100;
        flash = hooks.reducedMotion ? 0.08 : 0.18;
        coachLine = hooks.getAssistOn() ? "命中 · 辅助已开" : "命中";
        break;
      }
    }
    if (!hit) {
      misses += 1;
      score = Math.max(0, score - 15);
      coachLine = "未命中";
    }
  }

  function endRound() {
    if (ended) return;
    ended = true;
    running = false;
    const stats: GameStats = {
      hits,
      misses,
      score,
      assistOn: hooks.getAssistOn(),
      durationSec: ROUND_SEC,
    };
    const prev = Number(localStorage.getItem(BEST_KEY) || "0");
    if (stats.score > prev) localStorage.setItem(BEST_KEY, String(stats.score));
    hooks.onRoundEnd(stats);
  }

  function draw() {
    const w = canvas.width;
    const h = canvas.height;
    gctx.fillStyle = "#0a100e";
    gctx.fillRect(0, 0, w, h);

    gctx.strokeStyle = "rgba(232,240,230,0.05)";
    gctx.lineWidth = 1;
    for (let i = 1; i < 8; i++) {
      const x = (w / 8) * i;
      const y = (h / 8) * i;
      gctx.beginPath();
      gctx.moveTo(x, 0);
      gctx.lineTo(x, h);
      gctx.stroke();
      gctx.beginPath();
      gctx.moveTo(0, y);
      gctx.lineTo(w, y);
      gctx.stroke();
    }

    for (const d of drones) {
      if (!d.alive) continue;
      const cx = d.x * w;
      const cy = d.y * h;
      const radius = d.r * Math.min(w, h);
      const grad = gctx.createRadialGradient(
        cx - radius * 0.3,
        cy - radius * 0.3,
        radius * 0.2,
        cx,
        cy,
        radius,
      );
      if (d.label === "orange") {
        grad.addColorStop(0, "#ffb070");
        grad.addColorStop(1, "#e85a20");
      } else {
        grad.addColorStop(0, "#9ff0f2");
        grad.addColorStop(1, "#2bb8c4");
      }
      gctx.fillStyle = grad;
      gctx.beginPath();
      gctx.arc(cx, cy, radius, 0, Math.PI * 2);
      gctx.fill();
    }

    if (flash > 0) {
      gctx.fillStyle = `rgba(200,245,66,${flash * 0.35})`;
      gctx.fillRect(0, 0, w, h);
    }

    // Crosshair
    const aim = aimPoint();
    const ax = aim.x * w;
    const ay = aim.y * h;
    gctx.strokeStyle = "#e8f0e6";
    gctx.lineWidth = 1.5;
    gctx.beginPath();
    gctx.moveTo(ax - 14, ay);
    gctx.lineTo(ax + 14, ay);
    gctx.moveTo(ax, ay - 14);
    gctx.lineTo(ax, ay + 14);
    gctx.stroke();
    gctx.beginPath();
    gctx.arc(ax, ay, 10, 0, Math.PI * 2);
    gctx.stroke();
  }

  function drawHudOverlay() {
    const w = overlay.width;
    const h = overlay.height;
    octx.clearRect(0, 0, w, h);
    const boxes = hooks.getBoxes();
    const nearest = hooks.getAssistOn() ? nearestBox(boxes) : null;
    octx.font = "12px Manrope, system-ui, sans-serif";
    octx.lineWidth = 2;

    for (const box of boxes) {
      const x = box.x * w;
      const y = box.y * h;
      const bw = box.w * w;
      const bh = box.h * h;
      const isNear = nearest && box.id === nearest.id;
      octx.strokeStyle = isNear ? "#c8f542" : "#5ce1e6";
      octx.lineWidth = isNear ? 3 : 2;
      octx.strokeRect(x, y, bw, bh);
      if (!hooks.reducedMotion && isNear) {
        octx.strokeStyle = "rgba(200,245,66,0.35)";
        octx.strokeRect(x - 3, y - 3, bw + 6, bh + 6);
      }
      const tag = `${box.label} ${(box.score * 100).toFixed(0)}%`;
      octx.fillStyle = "rgba(11,15,12,0.72)";
      const tw = octx.measureText(tag).width + 10;
      octx.fillRect(x, Math.max(0, y - 18), tw, 16);
      octx.fillStyle = "#e8f0e6";
      octx.fillText(tag, x + 5, Math.max(12, y - 5));
    }
  }

  function tick(now: number) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (started && !ended) {
      timeLeft -= dt;
      if (timeLeft <= 0) {
        timeLeft = 0;
        endRound();
      }
      spawnAcc += dt;
      if (spawnAcc > 2.4 && drones.filter((d) => d.alive).length < 5) {
        spawnAcc = 0;
        spawnDrone();
      }
      for (const d of drones) {
        if (!d.alive) continue;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        if (d.x < d.r || d.x > 1 - d.r) d.vx *= -1;
        if (d.y < d.r || d.y > 1 - d.r) d.vy *= -1;
        d.x = Math.min(1 - d.r, Math.max(d.r, d.x));
        d.y = Math.min(1 - d.r, Math.max(d.r, d.y));
      }
      if (hooks.getAssistOn()) {
        const n = nearestBox(hooks.getBoxes());
        if (n) coachLine = "辅助：优先打高亮目标";
      }
    }

    flash = Math.max(0, flash - dt);
    draw();
    drawHudOverlay();
    raf = requestAnimationFrame(tick);
  }

  function pointerFromEvent(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = (e.clientX - rect.left) / rect.width;
    pointer.y = (e.clientY - rect.top) / rect.height;
  }

  function onPointerDown(e: PointerEvent) {
    canvas.setPointerCapture(e.pointerId);
    pointerFromEvent(e);
    pointer.down = true;
    if (!started && !ended) {
      started = true;
      coachLine = "开战 · 点击射击";
    }
    tryShoot();
  }

  function onPointerMove(e: PointerEvent) {
    pointerFromEvent(e);
  }

  function onPointerUp() {
    pointer.down = false;
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

  return {
    start() {
      hits = 0;
      misses = 0;
      score = 0;
      started = false;
      ended = false;
      timeLeft = ROUND_SEC;
      spawnAcc = 0;
      flash = 0;
      coachLine = "移动准星，点击射击橙/青无人机";
      resetDrones();
      running = true;
      last = performance.now();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    getHud() {
      const best = Number(localStorage.getItem(BEST_KEY) || "0");
      return {
        score,
        hits,
        misses,
        timeLeft,
        coachLine,
        best,
        started,
        ended,
      };
    },
    getCanvas: () => canvas,
  };
}

export function formatShare(stats: GameStats, best: number): string {
  return `Vision Assist Lab · score ${stats.score} (hits ${stats.hits}/${stats.hits + stats.misses}) · assist ${stats.assistOn ? "ON" : "OFF"} · best ${best} · https://hawk327ml.github.io/assist/`;
}

import "./style.css";
import { createTracker } from "./detect/tracker";
import type { Box, WorkerToMain } from "./detect/types";
import { createGame, formatShare, type GameStats } from "./game";

const bootEl = document.querySelector<HTMLDivElement>("#boot");
const bootCopyEl = document.querySelector<HTMLParagraphElement>("#boot-copy");
const gameCanvas = document.querySelector<HTMLCanvasElement>("#game");
const overlayCanvas = document.querySelector<HTMLCanvasElement>("#overlay");
const debugEl = document.querySelector<HTMLDivElement>("#debug");
const dbgFps = document.querySelector<HTMLSpanElement>("#dbg-fps");
const dbgInfer = document.querySelector<HTMLSpanElement>("#dbg-infer");
const dbgBoxes = document.querySelector<HTMLSpanElement>("#dbg-boxes");
const assistBtn = document.querySelector<HTMLButtonElement>("#assist-toggle");
const hudTime = document.querySelector<HTMLSpanElement>("#hud-time");
const hudScore = document.querySelector<HTMLSpanElement>("#hud-score");
const hudBest = document.querySelector<HTMLSpanElement>("#hud-best");
const hudCoach = document.querySelector<HTMLSpanElement>("#hud-coach");
const coachCard = document.querySelector<HTMLDivElement>("#coach-card");
const resultEl = document.querySelector<HTMLDivElement>("#result");
const resultCopy = document.querySelector<HTMLParagraphElement>("#result-copy");
const btnAgain = document.querySelector<HTMLButtonElement>("#btn-again");
const btnShare = document.querySelector<HTMLButtonElement>("#btn-share");
const shareStatus = document.querySelector<HTMLParagraphElement>("#share-status");

const params = new URLSearchParams(location.search);
const debugOn = params.has("debug");
if (debugOn && debugEl) debugEl.hidden = false;

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const lean =
  navigator.hardwareConcurrency <= 4 ||
  /Android|iPhone|iPad/i.test(navigator.userAgent);
const maxSide = lean ? 256 : 320;
const frameStride = lean ? 3 : 2;

if (!gameCanvas || !overlayCanvas) {
  throw new Error("assist canvases missing");
}

let assistOn = false;
let tracked: Box[] = [];
let inFlight = false;
let lastDetAt = 0;
let detFps = 0;
let frameGate = 0;
let lastStats: GameStats | null = null;
const tracker = createTracker();

const worker = new Worker(new URL("./detect/worker.ts", import.meta.url), {
  type: "module",
});

function hideBoot() {
  bootEl?.classList.add("is-done");
  window.setTimeout(() => bootEl?.remove(), 420);
}

function showFail(message: string) {
  if (bootCopyEl) bootCopyEl.textContent = message;
  bootEl?.classList.remove("is-done");
}

function setAssist(on: boolean) {
  assistOn = on;
  if (assistBtn) {
    assistBtn.setAttribute("aria-pressed", String(on));
    assistBtn.textContent = on ? "Assist On" : "Assist Off";
  }
}

assistBtn?.addEventListener("click", () => setAssist(!assistOn));

const game = createGame(gameCanvas, overlayCanvas, {
  getBoxes: () => tracked,
  getAssistOn: () => assistOn,
  reducedMotion,
  onRoundEnd: (stats) => {
    lastStats = stats;
    const best = Number(localStorage.getItem("vision-assist-lab-best") || "0");
    if (resultEl) resultEl.hidden = false;
    if (resultCopy) {
      resultCopy.textContent = `Score ${stats.score} · hits ${stats.hits} · misses ${stats.misses} · assist ${stats.assistOn ? "ON" : "OFF"} · best ${Math.max(best, stats.score)}`;
    }
    if (shareStatus) shareStatus.hidden = true;
  },
});

function syncHud() {
  const h = game.getHud();
  if (hudTime) hudTime.textContent = `${h.timeLeft.toFixed(1)}s`;
  if (hudScore) hudScore.textContent = `Score ${h.score}`;
  if (hudBest) hudBest.textContent = `Best ${h.best}`;
  if (hudCoach) hudCoach.textContent = h.coachLine;
}

worker.onmessage = (event: MessageEvent<WorkerToMain>) => {
  const msg = event.data;
  if (msg.type === "ready") {
    hideBoot();
    game.start();
    window.setTimeout(() => coachCard?.classList.add("is-hidden"), reducedMotion ? 900 : 3800);
    return;
  }
  if (msg.type === "error") {
    inFlight = false;
    showFail(`Worker error · ${msg.message}`);
    return;
  }
  if (msg.type === "det") {
    inFlight = false;
    tracked = tracker.update(msg.boxes);
    const now = performance.now();
    if (lastDetAt > 0) {
      const dt = now - lastDetAt;
      detFps = dt > 0 ? 1000 / dt : 0;
    }
    lastDetAt = now;
    if (dbgFps) dbgFps.textContent = `det ${detFps.toFixed(1)} fps`;
    if (dbgInfer) dbgInfer.textContent = `infer ${msg.inferMs.toFixed(1)} ms`;
    if (dbgBoxes) dbgBoxes.textContent = `boxes ${tracked.length}`;
  }
};

worker.onerror = (err) => {
  showFail(`Worker failed · ${err.message || "unknown"}`);
};

worker.postMessage({ type: "init" });

function feedDetector() {
  frameGate = (frameGate + 1) % frameStride;
  if (frameGate !== 0 || inFlight) return;
  inFlight = true;
  createImageBitmap(game.getCanvas())
    .then((bitmap) => {
      worker.postMessage(
        { type: "frame", bitmap, t: performance.now(), maxSide },
        [bitmap],
      );
    })
    .catch((err: unknown) => {
      inFlight = false;
      const message = err instanceof Error ? err.message : String(err);
      showFail(`Frame capture failed · ${message}`);
    });
}

function loop() {
  syncHud();
  feedDetector();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

btnAgain?.addEventListener("click", () => {
  if (resultEl) resultEl.hidden = true;
  tracker.reset();
  tracked = [];
  game.start();
  coachCard?.classList.remove("is-hidden");
  window.setTimeout(() => coachCard?.classList.add("is-hidden"), reducedMotion ? 700 : 2800);
});

btnShare?.addEventListener("click", async () => {
  if (!lastStats) return;
  const best = Number(localStorage.getItem("vision-assist-lab-best") || "0");
  const text = formatShare(lastStats, Math.max(best, lastStats.score));
  try {
    await navigator.clipboard.writeText(text);
    if (shareStatus) {
      shareStatus.hidden = false;
      shareStatus.textContent = "已复制到剪贴板";
    }
  } catch {
    if (shareStatus) {
      shareStatus.hidden = false;
      shareStatus.textContent = text;
    }
  }
});

window.setTimeout(() => {
  if (bootEl?.isConnected) {
    hideBoot();
    game.start();
  }
}, 5000);

document.addEventListener("visibilitychange", () => {
  if (document.hidden) inFlight = false;
});

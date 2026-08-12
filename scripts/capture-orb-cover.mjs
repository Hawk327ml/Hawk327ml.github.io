/**
 * Capture a ~15s silent Orb Courier loop for the portfolio card.
 * Uses system Chrome + @ffmpeg-installer (no Playwright Chromium download).
 *
 * Usage:
 *   npm run build
 *   npm run capture:orb-cover
 *   npm run capture:orb-cover -- https://hawk327ml.github.io
 */
import { chromium } from "playwright";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outWebm = path.join(root, "public", "thumbs", "orb-courier.webm");
const requestedUrl = process.argv[2];
const FPS = 12;
const DURATION_SEC = 15;
const FRAME_COUNT = FPS * DURATION_SEC;

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { ...opts, stdio: "inherit", shell: true });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited ${code}`));
    });
  });
}

async function waitForServer(url, timeoutMs = 90000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: "GET" });
      if (res.ok || res.status === 304) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Server not ready: ${url}`);
}

async function startPreview() {
  const preview = spawn(
    "npm",
    ["run", "preview", "--", "--host", "127.0.0.1", "--port", "4173"],
    { cwd: root, shell: true, stdio: "ignore" },
  );
  const base = "http://127.0.0.1:4173";
  await waitForServer(`${base}/play/`);
  return {
    base,
    stop: () => {
      preview.kill("SIGTERM");
    },
  };
}

async function main() {
  let stopPreview = null;
  let base = requestedUrl;
  if (!base) {
    const preview = await startPreview();
    base = preview.base;
    stopPreview = preview.stop;
  }

  const frameDir = await mkdtemp(path.join(tmpdir(), "orb-frames-"));
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });

  try {
    await page.goto(`${base.replace(/\/$/, "")}/play/?orb=${Date.now()}`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });

    const classic = page.locator('[data-mode="classic"]');
    await classic.waitFor({ state: "visible", timeout: 90000 });
    await page.waitForFunction(
      () => {
        const btn = document.querySelector('[data-mode="classic"]');
        return btn instanceof HTMLButtonElement && !btn.disabled;
      },
      { timeout: 120000 },
    );
    await classic.click();
    await page.waitForSelector("#hud:not([hidden])", { timeout: 30000 });
    await page.waitForTimeout(700);

    // Hide chrome UI for a cleaner cover crop.
    await page.addStyleTag({
      content: `
        #boot, #mode-pick, .credit, .back, #coach, #hint, #toast, #proximity, #edge { display: none !important; }
        #hud { background: transparent !important; }
        .hud-top, .pad { opacity: 0.35; }
      `,
    });

    await page.keyboard.down("KeyW");
    const interval = 1000 / FPS;
    for (let i = 0; i < FRAME_COUNT; i++) {
      const t0 = Date.now();
      if (i % 36 < 14) await page.keyboard.down("Shift");
      else await page.keyboard.up("Shift");
      if (i % 48 < 16) await page.keyboard.down("KeyD");
      else await page.keyboard.up("KeyD");

      const file = path.join(frameDir, `frame_${String(i).padStart(4, "0")}.png`);
      await page.screenshot({ path: file, type: "png" });

      const spent = Date.now() - t0;
      if (spent < interval) await page.waitForTimeout(interval - spent);
    }
    await page.keyboard.up("KeyW");
    await page.keyboard.up("KeyD");
    await page.keyboard.up("Shift");
  } finally {
    await browser.close();
    if (stopPreview) stopPreview();
  }

  await mkdir(path.dirname(outWebm), { recursive: true });
  await run(ffmpegInstaller.path, [
    "-y",
    "-framerate",
    String(FPS),
    "-i",
    path.join(frameDir, "frame_%04d.png"),
    "-c:v",
    "libvpx-vp9",
    "-b:v",
    "1M",
    "-an",
    "-pix_fmt",
    "yuv420p",
    outWebm,
  ]);
  await rm(frameDir, { recursive: true, force: true });
  console.log(`Wrote ${outWebm}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

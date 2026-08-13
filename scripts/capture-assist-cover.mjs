/**
 * Capture ~15s Vision Assist Lab cover for portfolio card.
 * Usage:
 *   npm run build
 *   npm run capture:assist-cover
 */
import { chromium } from "playwright";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outWebm = path.join(root, "public", "thumbs", "vision-assist.webm");
const requestedUrl = process.argv[2];
const FPS = 12;
const DURATION_SEC = 15;
const FRAME_COUNT = FPS * DURATION_SEC;

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", shell: false });
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
    { cwd: root, stdio: "ignore", shell: true },
  );
  const base = "http://127.0.0.1:4173";
  await waitForServer(`${base}/assist/`);
  return {
    base,
    stop: () => preview.kill("SIGTERM"),
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

  const frameDir = await mkdtemp(path.join(tmpdir(), "assist-frames-"));
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });

  try {
    await page.goto(`${base.replace(/\/$/, "")}/assist/?cap=${Date.now()}`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await page.waitForSelector("#game", { timeout: 60000 });
    await page.waitForFunction(
      () => {
        const boot = document.querySelector("#boot");
        return !boot || boot.classList.contains("is-done") || !boot.isConnected;
      },
      { timeout: 20000 },
    );
    await page.waitForTimeout(700);

    const assistBtn = page.locator("#assist-toggle");
    if ((await assistBtn.getAttribute("aria-pressed")) !== "true") {
      await assistBtn.click();
    }

    await page.addStyleTag({
      content: `
        .boot, .disclaimer, .debug, .result, .coach-card { display: none !important; }
      `,
    });

    const stage = page.locator("#stage");
    const box = await stage.boundingBox();
    if (!box) throw new Error("stage missing bounds");

    const interval = 1000 / FPS;
    for (let i = 0; i < FRAME_COUNT; i++) {
      const t0 = Date.now();
      const t = i / FPS;
      const px = box.x + box.width * (0.35 + 0.28 * Math.sin(t * 1.7));
      const py = box.y + box.height * (0.4 + 0.22 * Math.cos(t * 1.3));
      await page.mouse.move(px, py);
      if (i % 18 === 0) await page.mouse.click(px, py);
      const file = path.join(frameDir, `frame_${String(i).padStart(4, "0")}.png`);
      await page.screenshot({ path: file, type: "png" });
      const spent = Date.now() - t0;
      if (spent < interval) await page.waitForTimeout(interval - spent);
    }
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

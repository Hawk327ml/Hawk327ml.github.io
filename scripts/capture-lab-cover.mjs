/**
 * Capture ~15s Shader Lab cover (pointer dig hole loop).
 * Usage: npm run build && npm run capture:lab-cover
 */
import { chromium } from "playwright";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outWebm = path.join(root, "public", "thumbs", "shader-lab.webm");
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
  await waitForServer(`${base}/lab/`);
  return { base, stop: () => preview.kill("SIGTERM") };
}

async function main() {
  let stopPreview = null;
  let base = requestedUrl;
  if (!base) {
    const preview = await startPreview();
    base = preview.base;
    stopPreview = preview.stop;
  }

  const frameDir = await mkdtemp(path.join(tmpdir(), "lab-frames-"));
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });

  try {
    await page.goto(`${base.replace(/\/$/, "")}/lab/?cap=${Date.now()}`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await page.waitForSelector("#c", { timeout: 60000 });
    await page.waitForTimeout(700);

    await page.addStyleTag({
      content: `
        .top .docs { opacity: 0 !important; }
      `,
    });

    // Start on domain warp for richer dig read, then cycle.
    await page.locator('[data-sketch="2"]').click();
    await page.waitForTimeout(400);

    const interval = 1000 / FPS;
    for (let i = 0; i < FRAME_COUNT; i++) {
      const t0 = Date.now();
      const t = i / FPS;
      const px = 640 + Math.cos(t * 1.4) * 280;
      const py = 360 + Math.sin(t * 1.1) * 160;
      await page.mouse.move(px, py);
      if (i === 60) await page.locator('[data-sketch="0"]').click();
      if (i === 120) await page.locator('[data-sketch="1"]').click();
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

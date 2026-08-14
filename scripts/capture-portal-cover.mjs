/**
 * Capture ~15s Focus Portal login cover for portfolio card.
 * Usage (from portfolio root):
 *   node scripts/capture-portal-cover.mjs
 */
import { chromium } from "playwright";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const loginDir = path.resolve(root, "..", "csm3401-focus-portal", "login");
const outWebm = path.join(root, "public", "thumbs", "focus-portal.webm");
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

async function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Server not ready: ${url}`);
}

async function startPreview() {
  const preview = spawn(
    "npx",
    ["--yes", "serve", ".", "-l", "4190"],
    { cwd: loginDir, stdio: "ignore", shell: true },
  );
  const base = "http://127.0.0.1:4190";
  await waitForServer(base);
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

  const frameDir = await mkdtemp(path.join(tmpdir(), "portal-frames-"));
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });

  try {
    await page.goto(`${base.replace(/\/$/, "")}/?cap=${Date.now()}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForSelector(".portal-wrapper", { timeout: 30000 });
    await page.waitForTimeout(800);

    // Mild motion: focus email then password for cover life.
    await page.locator("#email").click();
    await page.locator("#email").fill("demo@hawk.lab");

    const interval = 1000 / FPS;
    for (let i = 0; i < FRAME_COUNT; i++) {
      const t0 = Date.now();
      if (i === 40) await page.locator("#password").click();
      if (i === 80) await page.locator("#loginBtn").hover();
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

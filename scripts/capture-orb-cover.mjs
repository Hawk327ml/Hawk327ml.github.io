/**
 * Capture a ~15s silent Orb Courier loop for the portfolio card.
 * Usage: node scripts/capture-orb-cover.mjs [baseUrl]
 * Default: builds preview on http://127.0.0.1:4173
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outWebm = path.join(root, "public", "thumbs", "orb-courier.webm");
const requestedUrl = process.argv[2];

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

  const videoDir = await mkdtemp(path.join(tmpdir(), "orb-cover-"));
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: videoDir,
      size: { width: 1280, height: 720 },
    },
  });
  const page = await context.newPage();

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
    await page.waitForTimeout(800);

    const end = Date.now() + 15000;
    while (Date.now() < end) {
      const slice = Math.min(2200, end - Date.now());
      await page.keyboard.down("KeyW");
      if (Date.now() % 5000 < 1800) await page.keyboard.down("Shift");
      else await page.keyboard.up("Shift");
      if (Date.now() % 7000 < 1600) await page.keyboard.down("KeyD");
      else await page.keyboard.up("KeyD");
      await page.waitForTimeout(slice);
    }
    await page.keyboard.up("KeyW");
    await page.keyboard.up("KeyD");
    await page.keyboard.up("Shift");
    await page.waitForTimeout(400);
  } finally {
    await context.close();
    await browser.close();
    if (stopPreview) stopPreview();
  }

  const files = (await readdir(videoDir)).filter((f) => f.endsWith(".webm"));
  if (!files.length) throw new Error("No WebM recorded by Playwright");
  await mkdir(path.dirname(outWebm), { recursive: true });
  await copyFile(path.join(videoDir, files[0]), outWebm);
  await rm(videoDir, { recursive: true, force: true });
  console.log(`Wrote ${outWebm}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

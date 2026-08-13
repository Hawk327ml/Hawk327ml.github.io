/**
 * Capture ~15s AAPL Forecast cover from locked notebook figures.
 * (Streamlit app source is not in-repo; Live URL may cold-start.)
 *
 * Usage:
 *   npm run capture:aapl-cover
 */
import { chromium } from "playwright";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { spawn } from "node:child_process";
import { copyFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outWebm = path.join(root, "public", "thumbs", "aapl.webm");
const aaplRoot = path.resolve(root, "..", "AAPL-Stock-Prediction");
const figuresDir = path.join(
  aaplRoot,
  "Submission_By_Phase",
  "03_Model_Development_30pct",
  "figures",
);
const figures = [
  "selected_model_test_predictions_and_residuals.png",
  "validation_comparison_and_overfitting.png",
  "selected_model_feature_importance.png",
];
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

async function main() {
  const work = await mkdtemp(path.join(tmpdir(), "aapl-cover-"));
  for (const name of figures) {
    await copyFile(path.join(figuresDir, name), path.join(work, name));
  }

  const html = `<!doctype html>
<html lang="zh-Hans">
<head>
  <meta charset="UTF-8" />
  <style>
    html, body { margin:0; height:100%; background:#071018; color:#e8f0e6;
      font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; overflow:hidden; }
    .stage { position:relative; width:1280px; height:720px; }
    .bg {
      position:absolute; inset:0;
      background:
        radial-gradient(ellipse 70% 50% at 20% 10%, rgba(92,225,230,.18), transparent 55%),
        radial-gradient(ellipse 50% 40% at 90% 80%, rgba(200,245,66,.08), transparent 50%),
        #071018;
    }
    .copy {
      position:absolute; left:48px; top:42px; z-index:3; max-width:720px;
    }
    .brand {
      margin:0; letter-spacing:.14em; font-size:28px; font-weight:700; color:#5ce1e6;
    }
    .line {
      margin:.55rem 0 0; font-size:22px; line-height:1.35; font-weight:600;
    }
    .meta {
      margin:.45rem 0 0; color:#8a9a88; font-size:15px;
    }
    .frame {
      position:absolute; left:48px; right:48px; top:150px; bottom:48px;
      border:1px solid rgba(232,240,230,.12); overflow:hidden; background:#0b1218;
    }
    .frame img {
      position:absolute; inset:0; width:100%; height:100%; object-fit:contain;
      opacity:0; transform:scale(1.04);
      transition: opacity .7s ease, transform 5s ease;
    }
    .frame img.is-on { opacity:1; transform:scale(1); }
  </style>
</head>
<body>
  <div class="stage">
    <div class="bg"></div>
    <div class="copy">
      <p class="brand">AAPL FORECAST</p>
      <p class="line">点开即看次日 Adj Close：Ridge · MAE 2.12 / R² 0.987</p>
      <p class="meta">Notebook 口径 · 非交易建议 · 方向准确率≈硬币</p>
    </div>
    <div class="frame" id="frame">
      ${figures.map((f, i) => `<img src="${f}" alt="" data-i="${i}" ${i === 0 ? 'class="is-on"' : ""} />`).join("\n")}
    </div>
  </div>
  <script>
    const imgs = [...document.querySelectorAll('#frame img')];
    let i = 0;
    setInterval(() => {
      imgs[i].classList.remove('is-on');
      i = (i + 1) % imgs.length;
      imgs[i].classList.add('is-on');
    }, 5000);
  </script>
</body>
</html>`;
  const htmlPath = path.join(work, "index.html");
  await writeFile(htmlPath, html, "utf8");

  const frameDir = await mkdtemp(path.join(tmpdir(), "aapl-frames-"));
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });

  try {
    await page.goto(pathToFileURL(htmlPath).href, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(600);

    const interval = 1000 / FPS;
    for (let i = 0; i < FRAME_COUNT; i++) {
      const t0 = Date.now();
      const file = path.join(frameDir, `frame_${String(i).padStart(4, "0")}.png`);
      await page.screenshot({ path: file, type: "png" });
      const spent = Date.now() - t0;
      if (spent < interval) await page.waitForTimeout(interval - spent);
    }
  } finally {
    await browser.close();
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
  await rm(work, { recursive: true, force: true });
  console.log(`Wrote ${outWebm}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

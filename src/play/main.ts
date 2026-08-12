import "./style.css";

const bootEl = document.querySelector<HTMLDivElement>("#boot");
const bootCopyEl = document.querySelector<HTMLParagraphElement>("#boot-copy");
const modePickEl = document.querySelector<HTMLDivElement>("#mode-pick");
const engineStatusEl = document.querySelector<HTMLParagraphElement>("#engine-status");

function revealShell() {
  if (bootEl) {
    bootEl.classList.add("is-done");
    window.setTimeout(() => {
      if (bootEl.isConnected) bootEl.remove();
    }, 420);
  }
  if (modePickEl) modePickEl.hidden = false;
  modePickEl?.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((btn) => {
    btn.disabled = true;
  });
  if (engineStatusEl) {
    engineStatusEl.hidden = false;
    engineStatusEl.textContent = "引擎加载中…（首次约 0.5MB）";
  }
}

function hardReload() {
  const url = new URL(location.href);
  url.searchParams.set("orb", String(Date.now()));
  location.replace(url.toString());
}

function showFail(err: unknown) {
  const raw = err instanceof Error ? err.message : String(err);
  const webgl = /webgl/i.test(raw);
  const text = webgl
    ? "WebGL 不可用 · 请换 Chrome/Edge 再开"
    : `引擎加载失败 · ${raw.slice(0, 60) || "网络超时"} · 点击重试`;
  if (engineStatusEl) {
    engineStatusEl.hidden = false;
    engineStatusEl.textContent = text;
    engineStatusEl.style.cursor = "pointer";
    engineStatusEl.onclick = () => hardReload();
  } else if (bootCopyEl) {
    bootCopyEl.textContent = text;
  }
}

async function loadEngine(attempt = 1): Promise<void> {
  if (engineStatusEl && attempt > 1) {
    engineStatusEl.textContent = `引擎重试中…（${attempt}/3）`;
  }
  try {
    await import("./game");
    document.documentElement.style.cursor = "auto";
    document.body.style.cursor = "auto";
    if (engineStatusEl) {
      engineStatusEl.hidden = true;
      engineStatusEl.style.cursor = "";
      engineStatusEl.onclick = null;
    }
  } catch (err) {
    console.error(`orb engine load attempt ${attempt}`, err);
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 700 * attempt));
      return loadEngine(attempt + 1);
    }
    showFail(err);
  }
}

// Let Vite preload misses fall through to import() retries instead of hard-crashing.
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
});

revealShell();
void loadEngine();

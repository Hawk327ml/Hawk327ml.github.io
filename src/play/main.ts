import "./style.css";

type ModeId = "classic" | "challenge" | "timed";

type GameModule = {
  orbReady?: boolean;
  selectOrbMode?: (mode: ModeId) => void;
};

const bootEl = document.querySelector<HTMLDivElement>("#boot");
const bootCopyEl = document.querySelector<HTMLParagraphElement>("#boot-copy");
const modePickEl = document.querySelector<HTMLDivElement>("#mode-pick");
const engineStatusEl = document.querySelector<HTMLParagraphElement>("#engine-status");
const modeButtons = [
  ...(modePickEl?.querySelectorAll<HTMLButtonElement>("[data-mode]") ?? []),
];

let pendingMode: ModeId | null = null;
let selectOrbMode: ((mode: ModeId) => void) | null = null;

function revealShell() {
  if (bootEl) {
    bootEl.classList.add("is-done");
    window.setTimeout(() => {
      if (bootEl.isConnected) bootEl.remove();
    }, 420);
  }
  if (modePickEl) modePickEl.hidden = false;
  setButtonsEnabled(false);
  if (engineStatusEl) {
    engineStatusEl.hidden = false;
    engineStatusEl.textContent = "引擎加载中…（首次约 0.5MB）";
  }
}

function setButtonsEnabled(on: boolean) {
  modeButtons.forEach((btn) => {
    btn.disabled = !on;
    btn.style.cursor = on ? "pointer" : "not-allowed";
  });
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
  setButtonsEnabled(false);
}

function isModeId(value: string | undefined): value is ModeId {
  return value === "classic" || value === "challenge" || value === "timed";
}

function trySelect(mode: ModeId) {
  if (!selectOrbMode) {
    pendingMode = mode;
    if (engineStatusEl) {
      engineStatusEl.hidden = false;
      engineStatusEl.textContent = "引擎还在加载，选中后会自动开始…";
    }
    return;
  }
  try {
    selectOrbMode(mode);
  } catch (err) {
    console.error(err);
    showFail(err);
  }
}

function wireModeButtons() {
  modeButtons.forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const mode = btn.dataset.mode;
      if (!isModeId(mode)) return;
      trySelect(mode);
    });
  });
}

async function loadEngine(attempt = 1): Promise<void> {
  if (engineStatusEl && attempt > 1) {
    engineStatusEl.textContent = `引擎重试中…（${attempt}/3）`;
  }
  try {
    const game = (await import("./game")) as GameModule | undefined;
    document.documentElement.style.cursor = "auto";
    document.body.style.cursor = "auto";

    // Vite __vitePreload can resolve to undefined if vite:preloadError is
    // preventDefault'd — guard before touching exports.
    if (!game || typeof game.selectOrbMode !== "function" || game.orbReady !== true) {
      throw new Error("ORB_EXPORT_MISSING");
    }

    selectOrbMode = game.selectOrbMode;
    setButtonsEnabled(true);
    if (engineStatusEl) {
      engineStatusEl.hidden = true;
      engineStatusEl.style.cursor = "";
      engineStatusEl.onclick = null;
    }

    if (pendingMode) {
      const mode = pendingMode;
      pendingMode = null;
      trySelect(mode);
    }
  } catch (err) {
    console.error(`orb engine load attempt ${attempt}`, err);
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 900 * attempt));
      return loadEngine(attempt + 1);
    }
    showFail(err);
  }
}

revealShell();
wireModeButtons();
void loadEngine();

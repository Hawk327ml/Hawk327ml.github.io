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
    engineStatusEl.textContent = "引擎加载中…（约 0.5MB，可先看路线）";
  }
}

revealShell();

void import("./game")
  .then(() => {
    if (engineStatusEl) engineStatusEl.hidden = true;
  })
  .catch((err) => {
    console.error(err);
    if (engineStatusEl) {
      engineStatusEl.hidden = false;
      engineStatusEl.textContent = "引擎加载失败 · 点击页面重试";
      engineStatusEl.style.cursor = "pointer";
      engineStatusEl.onclick = () => location.reload();
    } else if (bootCopyEl) {
      bootCopyEl.textContent = "引擎加载失败 · 刷新重试";
    }
  });

import "./style.css";
import { AudioTransport, type Bands } from "./audio";
import { PulseScene } from "./scene";

const canvas = document.querySelector<HTMLCanvasElement>("#c");
const playBtn = document.querySelector<HTMLButtonElement>("#playBtn");
const pauseBtn = document.querySelector<HTMLButtonElement>("#pauseBtn");
const trackBtn = document.querySelector<HTMLButtonElement>("#trackBtn");
const muteBtn = document.querySelector<HTMLButtonElement>("#muteBtn");
const center = document.querySelector<HTMLDivElement>("#center");
const status = document.querySelector<HTMLDivElement>("#status");
const statusLine = document.querySelector<HTMLParagraphElement>("#statusLine");
const meters = document.querySelector<HTMLDivElement>("#meters");

if (
  !canvas ||
  !playBtn ||
  !pauseBtn ||
  !trackBtn ||
  !muteBtn ||
  !center ||
  !status ||
  !statusLine ||
  !meters
) {
  throw new Error("pulse mounts missing");
}

const play = playBtn;
const pause = pauseBtn;
const track = trackBtn;
const mute = muteBtn;
const centerEl = center;
const statusEl = status;
const statusText = statusLine;
const metersEl = meters;

const lean =
  window.innerWidth < 720 ||
  (navigator.hardwareConcurrency ?? 8) <= 4 ||
  ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 4;

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const audio = new AudioTransport(lean);
const scene = new PulseScene(canvas, lean, reduceMotion);

const meterBass = metersEl.querySelector<HTMLElement>('[data-band="bass"]');
const meterMid = metersEl.querySelector<HTMLElement>('[data-band="mid"]');
const meterHigh = metersEl.querySelector<HTMLElement>('[data-band="high"]');
const debugMeters = new URLSearchParams(window.location.search).has("debug");
if (debugMeters) {
  metersEl.hidden = false;
  metersEl.setAttribute("aria-hidden", "false");
}

let last = performance.now();

play.addEventListener("click", () => void onPlayToggle());
pause.addEventListener("click", () => void onPlayToggle());
track.addEventListener("click", () => void onTrack());
mute.addEventListener("click", onMute);
window.addEventListener("resize", () => scene.resize());
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) last = performance.now();
});

syncPlayUi();
requestAnimationFrame(tick);

async function onPlayToggle() {
  try {
    await audio.toggle();
    syncPlayUi();
  } catch (err) {
    statusText.textContent = "无法播放音轨，请检查 /audio";
    statusEl.hidden = false;
    console.error(err);
  }
}

async function onTrack() {
  try {
    await audio.nextTrack();
    syncPlayUi();
  } catch (err) {
    console.error(err);
  }
}

function onMute() {
  const muted = audio.toggleMute();
  mute.classList.toggle("is-on", muted);
  mute.textContent = muted ? "静音" : "音量";
}

function trackLabel() {
  const t = audio.tracks[audio.trackIndex];
  return t.label;
}

function syncPlayUi() {
  const playing = audio.playing;
  track.textContent = audio.trackId;
  centerEl.classList.toggle("is-playing", playing);
  document.body.classList.toggle("is-playing", playing);
  statusEl.hidden = !playing;
  if (playing) {
    statusText.textContent = `跟随中 · ${trackLabel()}`;
  }
}

function tick(now: number) {
  requestAnimationFrame(tick);
  if (document.hidden) return;

  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  const bands = audio.sample();
  updateMeters(bands);
  scene.update(bands, dt, audio.playing);
}

function updateMeters(bands: Bands) {
  if (!debugMeters) return;
  if (meterBass) meterBass.style.width = `${Math.round(bands.bass * 100)}%`;
  if (meterMid) meterMid.style.width = `${Math.round(bands.mid * 100)}%`;
  if (meterHigh) meterHigh.style.width = `${Math.round(bands.high * 100)}%`;
}

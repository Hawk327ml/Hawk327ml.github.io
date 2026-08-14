import "./style.css";
import { LabScene } from "./scene";
import { pulseGlow } from "./sketches/pulseGlow";
import { sdfCircle } from "./sketches/sdfCircle";
import { domainWarp } from "./sketches/domainWarp";
import type { SketchDef } from "./sketches/common";

const canvas = document.querySelector<HTMLCanvasElement>("#c");
const tipEl = document.querySelector<HTMLParagraphElement>("#tip");
const buttons = [...document.querySelectorAll<HTMLButtonElement>(".sketch-btn")];

if (!canvas || !tipEl || buttons.length === 0) {
  throw new Error("lab mounts missing");
}

const sketches: SketchDef[] = [pulseGlow, sdfCircle, domainWarp];

const lean =
  window.innerWidth < 720 ||
  (navigator.hardwareConcurrency ?? 8) <= 4 ||
  /Android|iPhone|iPad/i.test(navigator.userAgent);

const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let sketchIndex = 0;

const scene = new LabScene(canvas, lean, sketches[0]);
scene.setReducedMotion(motionQuery.matches);
tipEl.textContent = sketches[0].tip;

const pointer = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };

function setSketch(index: number) {
  sketchIndex = ((index % sketches.length) + sketches.length) % sketches.length;
  const sketch = sketches[sketchIndex];
  scene.setSketch(sketch);
  tipEl!.textContent = sketch.tip;
  buttons.forEach((btn, i) => {
    const on = i === sketchIndex;
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-selected", String(on));
  });
}

buttons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const i = Number(btn.dataset.sketch);
    if (Number.isFinite(i)) setSketch(i);
  });
});

window.addEventListener("keydown", (event) => {
  if (event.key >= "1" && event.key <= "3") {
    setSketch(Number(event.key) - 1);
  }
});

function onPointer(clientX: number, clientY: number) {
  pointer.targetX = clientX / Math.max(window.innerWidth, 1);
  pointer.targetY = 1 - clientY / Math.max(window.innerHeight, 1);
}

window.addEventListener(
  "pointermove",
  (event) => {
    onPointer(event.clientX, event.clientY);
  },
  { passive: true },
);

window.addEventListener(
  "touchmove",
  (event) => {
    const t = event.touches[0];
    if (t) onPointer(t.clientX, t.clientY);
  },
  { passive: true },
);

window.addEventListener("resize", () => scene.resize());

motionQuery.addEventListener("change", () => {
  scene.setReducedMotion(motionQuery.matches);
});

const start = performance.now();

function frame(now: number) {
  const t = (now - start) / 1000;
  const ease = motionQuery.matches ? 1 : 0.18;
  pointer.x += (pointer.targetX - pointer.x) * ease;
  pointer.y += (pointer.targetY - pointer.y) * ease;
  scene.setPointer(pointer.x, pointer.y);
  scene.render(t);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

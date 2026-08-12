import "./style.css";
import * as THREE from "three";

const PLANET_R = 5;
const WALK_SPEED = 2.55;
const SPRINT_SPEED = 4.55;
const CAM_LERP = 8.2;
const FOV_BASE = 48;
const FOV_SPRINT = 58;
const FOV_PUNCH = 4.5;
const SURFACE = PLANET_R + 0.18;
const NEAR_RANGE = 2.55;
const ACCEL = 12;
const DECEL = 14;
const TIME_LIMIT = 105;
const STICK_SPRINT = 0.72;
const LEAN = isLeanDevice();
const PICK_RANGE = LEAN ? 1.28 : 1.12;

type ModeId = "classic" | "challenge" | "timed";

type Job = {
  id: number;
  pickupMesh: THREE.Mesh;
  pickupRing: THREE.Mesh;
  dropMesh: THREE.Mesh;
  dropLight: THREE.Mesh;
  dropRing: THREE.Mesh;
  held: boolean;
  done: boolean;
};

const MODE_META: Record<
  ModeId,
  { label: string; tag: string; goals: number; blurb: string }
> = {
  classic: { label: "Classic", tag: "CLASSIC", goals: 3, blurb: "free run" },
  challenge: { label: "Challenge", tag: "CHALLENGE", goals: 4, blurb: "long route" },
  timed: { label: "Timed", tag: "TIMED", goals: 3, blurb: "105s limit" },
};

const canvas = document.querySelector<HTMLCanvasElement>("#c");
const scoreNode = document.querySelector<HTMLParagraphElement>("#score");
const hintNode = document.querySelector<HTMLParagraphElement>("#hint");
const toastNode = document.querySelector<HTMLParagraphElement>("#toast");
const coachNode = document.querySelector<HTMLParagraphElement>("#coach");
const touchNode = document.querySelector<HTMLDivElement>("#touch");
const stickBaseNode = document.querySelector<HTMLDivElement>("#stick-base");
const stickKnobNode = document.querySelector<HTMLDivElement>("#stick-knob");
const sprintNode = document.querySelector<HTMLButtonElement>("#sprint");
const restartNode = document.querySelector<HTMLButtonElement>("#restart");
const bootNode = document.querySelector<HTMLDivElement>("#boot");
const hudNode = document.querySelector<HTMLDivElement>("#hud");
const objectiveNode = document.querySelector<HTMLParagraphElement>("#objective");
const proximityNode = document.querySelector<HTMLParagraphElement>("#proximity");
const timerNode = document.querySelector<HTMLParagraphElement>("#timer");
const bestNode = document.querySelector<HTMLParagraphElement>("#best");
const edgeNode = document.querySelector<HTMLDivElement>("#edge");
const resultNode = document.querySelector<HTMLDivElement>("#result");
const resultParcels = document.querySelector<HTMLElement>("#result-parcels");
const resultTime = document.querySelector<HTMLElement>("#result-time");
const resultBest = document.querySelector<HTMLElement>("#result-best");
const resultNote = document.querySelector<HTMLParagraphElement>("#result-note");
const modePickNode = document.querySelector<HTMLDivElement>("#mode-pick");
const modeTagNode = document.querySelector<HTMLParagraphElement>("#mode-tag");
const changeModeNode = document.querySelector<HTMLButtonElement>("#change-mode");
const resultKickerNode = document.querySelector<HTMLElement>("#result-kicker");
const resultTitleNode = document.querySelector<HTMLElement>("#result-title");
const resultModeNode = document.querySelector<HTMLElement>("#result-mode");

if (
  !canvas ||
  !scoreNode ||
  !hintNode ||
  !toastNode ||
  !coachNode ||
  !touchNode ||
  !stickBaseNode ||
  !stickKnobNode ||
  !sprintNode ||
  !restartNode ||
  !bootNode ||
  !hudNode ||
  !objectiveNode ||
  !proximityNode ||
  !timerNode ||
  !bestNode ||
  !edgeNode ||
  !resultNode ||
  !resultParcels ||
  !resultTime ||
  !resultBest ||
  !resultNote ||
  !modePickNode ||
  !modeTagNode ||
  !changeModeNode ||
  !resultKickerNode ||
  !resultTitleNode ||
  !resultModeNode
) {
  throw new Error("play HUD mounts missing");
}

const scoreEl = scoreNode;
const hintEl = hintNode;
const toastEl = toastNode;
const coachEl = coachNode;
const stickBaseEl = stickBaseNode;
const stickKnobEl = stickKnobNode;
const sprintBtn = sprintNode;
const restartBtn = restartNode;
const bootEl = bootNode;
const hudEl = hudNode;
const objectiveEl = objectiveNode;
const proximityEl = proximityNode;
const timerEl = timerNode;
const bestEl = bestNode;
const edgeEl = edgeNode;
const resultEl = resultNode;
const resultParcelsEl = resultParcels;
const resultTimeEl = resultTime;
const resultBestEl = resultBest;
const resultNoteEl = resultNote;
const modePickEl = modePickNode;
const modeTagEl = modeTagNode;
const changeModeBtn = changeModeNode;
const resultKickerEl = resultKickerNode;
const resultTitleEl = resultTitleNode;
const resultModeEl = resultModeNode;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: !LEAN,
  powerPreference: "high-performance",
  alpha: false,
});
renderer.setPixelRatio(pixelBudget());
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#121f2e");
scene.fog = new THREE.Fog("#152636", 14, 38);

const camera = new THREE.PerspectiveCamera(
  FOV_BASE,
  window.innerWidth / window.innerHeight,
  0.1,
  80,
);

scene.add(new THREE.HemisphereLight("#ffe8c8", "#2a4a62", 1.15));
const sun = new THREE.DirectionalLight("#fff2d8", 1.35);
sun.position.set(8, 12, 4);
scene.add(sun);

const planetDetail = LEAN ? 2 : 3;
const planet = new THREE.Mesh(
  new THREE.IcosahedronGeometry(PLANET_R, planetDetail),
  new THREE.MeshStandardMaterial({
    color: "#347d62",
    flatShading: true,
    roughness: 0.82,
    metalness: 0.05,
  }),
);
scene.add(planet);

const sea = new THREE.Mesh(
  new THREE.IcosahedronGeometry(PLANET_R * 0.992, LEAN ? 1 : 2),
  new THREE.MeshStandardMaterial({
    color: "#2a648c",
    flatShading: true,
    roughness: 0.48,
    metalness: 0.22,
  }),
);
sea.scale.setScalar(0.97);
scene.add(sea);

addStars();
const clouds = addClouds();
addLandPatches();
addLandmarks();

const courier = buildCourier();
scene.add(courier.root);

const guide = makeGuide();
scene.add(guide);

const dust = makeDust();
scene.add(dust.points);

const shared = {
  pickGeo: new THREE.IcosahedronGeometry(0.32, 0),
  dropGeo: new THREE.IcosahedronGeometry(0.34, 0),
  pickMat: markerMat("#ffd35a"),
  dropMat: markerMat("#ff6b3d"),
  pickRingGeo: new THREE.RingGeometry(0.5, 0.7, LEAN ? 16 : 28),
  dropRingGeo: new THREE.RingGeometry(0.61, 0.85, LEAN ? 16 : 28),
  pickRingMat: ringMat("#ffd35a"),
  dropRingMat: ringMat("#ff6b3d"),
  beamGeo: new THREE.CylinderGeometry(0.22, 0.55, 2.8, LEAN ? 6 : 8, 1, true),
  beamMat: new THREE.MeshBasicMaterial({
    color: "#ff8a3d",
    transparent: true,
    opacity: 0.58,
    side: THREE.DoubleSide,
    depthWrite: false,
  }),
  beamHaloGeo: new THREE.CylinderGeometry(0.42, 0.78, 2.55, LEAN ? 6 : 8, 1, true),
  beamHaloMat: new THREE.MeshBasicMaterial({
    color: "#ffb078",
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false,
  }),
};

const keys = {
  forward: false,
  back: false,
  left: false,
  right: false,
  sprint: false,
};

const stick = { x: 0, y: 0, active: false, pointerId: -1 };
let sprintToggle = false;
let coachTimer = 0;

const up = new THREE.Vector3(0, 1, 0);
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const move = new THREE.Vector3();
const camDesired = new THREE.Vector3();
const camLook = new THREE.Vector3();
const camVel = new THREE.Vector3();
const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();
const tmp3 = new THREE.Vector3();
const ndc = new THREE.Vector3();
const qAlign = new THREE.Quaternion();
const mAlign = new THREE.Matrix4();
const camForward = new THREE.Vector3();
const worldY = new THREE.Vector3(0, 1, 0);

let facing = new THREE.Vector3(0, 0, 1);
let speed = 0;
let carrying = false;
let delivered = 0;
let toastTimer = 0;
let finished = false;
let started = false;
let runTime = 0;
let idleHintAt = 8;
let jobs: Job[] = [];
let booted = false;
let awaitingMode = true;
let currentMode: ModeId | null = null;
let lastFov = FOV_BASE;
let fovPunch = 0;
let lastTimerSec = -1;
let dustCooldown = 0;
let lastEdgeKey = "";
let reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let audioCtx: AudioContext | null = null;

placeOnSphere(courier.root, worldY, facing);
camera.position
  .copy(courier.root.position)
  .addScaledVector(up.copy(worldY), 3.7)
  .addScaledVector(facing, -5.1);
camera.up.copy(worldY);
camera.lookAt(courier.root.position);
guide.visible = false;

window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);
window.addEventListener("resize", onResize);
window.addEventListener("blur", clearKeys);
document.addEventListener("visibilitychange", onVisibility);
restartBtn.addEventListener("click", () => {
  if (awaitingMode) return;
  resetRun(true);
});
changeModeBtn.addEventListener("click", openModePick);
modePickEl.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.mode;
    if (mode === "classic" || mode === "challenge" || mode === "timed") {
      selectMode(mode);
    }
  });
});
bindTouch();

const clock = new THREE.Clock();
requestAnimationFrame(tick);

function tick() {
  requestAnimationFrame(tick);
  if (document.hidden) return;

  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  if (booted && !awaitingMode && started && !finished && currentMode) {
    runTime += dt;
    updateTimerHud();
    if (currentMode === "timed" && runTime >= TIME_LIMIT) {
      finishRun(false);
    } else if (runTime > idleHintAt && delivered === 0 && !carrying) {
      hintEl.textContent = "跟着绿色箭头 / 屏幕边缘三角找黄块";
      idleHintAt = Number.POSITIVE_INFINITY;
    }
  }

  if (coachTimer > 0) {
    coachTimer -= dt;
    if (coachTimer <= 0 || started) hideCoach();
  }

  updateMovement(dt);
  updateCamera(dt);
  updateJobs();
  updateGuide();
  updateEdgeArrow();
  updateProximity();
  if (!reduceMotion) {
    updateDust(dt);
    pulseMarkers(t);
    spinClouds(dt);
  }

  if (toastTimer > 0) {
    toastTimer -= dt;
    if (toastTimer <= 0) toastEl.hidden = true;
  }

  renderer.render(scene, camera);

  if (!booted) {
    booted = true;
    requestAnimationFrame(() => {
      bootEl.classList.add("is-done");
      modePickEl.hidden = false;
      hudEl.hidden = true;
      window.setTimeout(() => bootEl.remove(), 480);
    });
  }
}

function selectMode(mode: ModeId) {
  currentMode = mode;
  awaitingMode = false;
  modePickEl.hidden = true;
  hudEl.hidden = false;
  modeTagEl.textContent = MODE_META[mode].tag;
  resultModeEl.textContent = MODE_META[mode].label;
  resetRun(true);
}

function openModePick() {
  awaitingMode = true;
  finished = true;
  started = false;
  clearKeys();
  resultEl.hidden = true;
  hudEl.hidden = true;
  modePickEl.hidden = false;
  guide.visible = false;
  edgeEl.hidden = true;
  proximityEl.hidden = true;
  toastEl.hidden = true;
  hideCoach();
  timerEl.classList.remove("is-urgent");
  resetStick();
  sprintToggle = false;
  sprintBtn.classList.remove("is-on");
  sprintBtn.setAttribute("aria-pressed", "false");
}

function goalCount() {
  return currentMode ? MODE_META[currentMode].goals : 3;
}

function updateTimerHud() {
  if (!currentMode) return;

  if (currentMode === "timed") {
    const left = Math.max(0, TIME_LIMIT - runTime);
    const sec = Math.floor(left);
    if (sec !== lastTimerSec) {
      lastTimerSec = sec;
      timerEl.textContent = formatTime(left);
    }
    timerEl.classList.toggle("is-urgent", left <= 15);
  } else {
    const sec = Math.floor(runTime);
    if (sec !== lastTimerSec) {
      lastTimerSec = sec;
      timerEl.textContent = formatTime(runTime);
    }
    timerEl.classList.remove("is-urgent");
  }
}

function updateMovement(dt: number) {
  if (awaitingMode || finished) return;

  up.copy(courier.root.position).normalize();
  camera.getWorldDirection(camForward);
  forward.copy(camForward).projectOnPlane(up).normalize();
  if (forward.lengthSq() < 1e-6) {
    forward.set(0, 0, 1).projectOnPlane(up).normalize();
  }
  right.crossVectors(forward, up).normalize();

  move.set(0, 0, 0);
  if (stick.active) {
    move.addScaledVector(forward, stick.y);
    move.addScaledVector(right, stick.x);
  } else {
    if (keys.forward) move.add(forward);
    if (keys.back) move.sub(forward);
    if (keys.left) move.sub(right);
    if (keys.right) move.add(right);
  }

  if (move.lengthSq() > 0) {
    if (!started) hideCoach();
    started = true;
  }

  const stickMag = stick.active ? Math.hypot(stick.x, stick.y) : 0;
  const wantSprint =
    (keys.sprint || sprintToggle || stickMag >= STICK_SPRINT) && move.lengthSq() > 0;
  const targetSpeed = move.lengthSq() > 0 ? (wantSprint ? SPRINT_SPEED : WALK_SPEED) : 0;
  const rate = targetSpeed > speed ? ACCEL : DECEL;
  speed = THREE.MathUtils.damp(speed, targetSpeed, rate, dt);

  if (move.lengthSq() > 0 && speed > 0.05) {
    move.normalize();
    const axis = tmp.copy(up).cross(move);
    if (axis.lengthSq() > 1e-8) {
      axis.normalize();
      courier.root.position.applyAxisAngle(axis, (speed * dt) / PLANET_R);
      courier.root.position.setLength(SURFACE);
    }
    facing.lerp(move, 1 - Math.exp(-14 * dt)).normalize();

    if (!reduceMotion) {
      const bobAmp = wantSprint ? 0.07 : 0.04;
      const bobHz = wantSprint ? 18 : 13;
      courier.bob.position.y = Math.sin(clock.elapsedTime * bobHz) * bobAmp;
      courier.bob.rotation.z = Math.sin(clock.elapsedTime * bobHz * 0.5) * (wantSprint ? 0.08 : 0.04);
    }
  } else {
    courier.bob.position.y = THREE.MathUtils.damp(courier.bob.position.y, 0, 12, dt);
    courier.bob.rotation.z = THREE.MathUtils.damp(courier.bob.rotation.z, 0, 10, dt);
  }

  alignToSurface(courier.root, facing);
}

function updateCamera(dt: number) {
  up.copy(courier.root.position).normalize();

  const sprintT = THREE.MathUtils.smoothstep(speed, WALK_SPEED * 0.6, SPRINT_SPEED);
  const back = 5.1 + sprintT * 1.35;
  const lift = 3.7 + sprintT * 0.55;

  camDesired
    .copy(courier.root.position)
    .addScaledVector(up, lift)
    .addScaledVector(facing, -back);

  const omega = 7.5;
  camVel.x += (omega * omega * (camDesired.x - camera.position.x) - 2 * omega * camVel.x) * dt;
  camVel.y += (omega * omega * (camDesired.y - camera.position.y) - 2 * omega * camVel.y) * dt;
  camVel.z += (omega * omega * (camDesired.z - camera.position.z) - 2 * omega * camVel.z) * dt;
  camera.position.x += camVel.x * dt;
  camera.position.y += camVel.y * dt;
  camera.position.z += camVel.z * dt;

  camLook.copy(courier.root.position).addScaledVector(up, 0.55).addScaledVector(facing, 0.35);
  camera.up.lerp(up, 1 - Math.exp(-CAM_LERP * dt)).normalize();
  camera.lookAt(camLook);

  const fovTarget = THREE.MathUtils.lerp(FOV_BASE, FOV_SPRINT, sprintT) + fovPunch;
  fovPunch = THREE.MathUtils.damp(fovPunch, 0, 6, dt);
  camera.fov = THREE.MathUtils.damp(camera.fov, fovTarget, 10, dt);
  if (Math.abs(camera.fov - lastFov) > 0.05) {
    lastFov = camera.fov;
    camera.updateProjectionMatrix();
  }
}

function updateJobs() {
  if (awaitingMode || finished) return;

  const goals = goalCount();
  for (const job of jobs) {
    if (job.done) continue;
    const playerPos = courier.root.position;

    if (!job.held && !carrying) {
      if (playerPos.distanceToSquared(job.pickupMesh.position) < PICK_RANGE * PICK_RANGE) {
        job.held = true;
        carrying = true;
        job.pickupMesh.visible = false;
        job.pickupRing.visible = false;
        courier.parcel.visible = true;
        burstDust(1.2);
        fovPunch = FOV_PUNCH;
        beep(520, 0.06, "triangle");
        showToast("PICKED UP");
        setObjective("DELIVER TO ORANGE BEAM");
        hintEl.textContent = "冲刺到橙光柱 · Shift";
        refreshJobVisibility();
      }
    } else if (job.held) {
      if (playerPos.distanceToSquared(job.dropMesh.position) < PICK_RANGE * PICK_RANGE) {
        job.held = false;
        job.done = true;
        carrying = false;
        delivered += 1;
        courier.parcel.visible = false;
        hideJob(job);
        burstDust(1.8);
        fovPunch = FOV_PUNCH * 1.35;
        beep(680, 0.07, "square");
        scoreEl.textContent = `${delivered} / ${goals}`;

        if (delivered >= goals) {
          finishRun(true);
        } else {
          showToast("DELIVERED");
          setObjective("FIND NEXT PACKAGE");
          hintEl.textContent = "继续找下一个黄块";
          refreshJobVisibility();
        }
      }
    }
  }
}

function finishRun(won: boolean) {
  if (finished) return;
  finished = true;
  guide.visible = false;
  edgeEl.hidden = true;
  proximityEl.hidden = true;
  hideCoach();
  resetStick();
  timerEl.classList.remove("is-urgent");

  const goals = goalCount();
  const mode = currentMode ?? "classic";
  resultModeEl.textContent = MODE_META[mode].label;
  resultParcelsEl.textContent = `${delivered} / ${goals}`;
  resultTimeEl.textContent =
    mode === "timed" ? formatTime(Math.min(runTime, TIME_LIMIT)) : formatTime(runTime);

  if (won) {
    resultKickerEl.textContent = "Route Clear";
    resultKickerEl.classList.remove("is-fail");
    resultTitleEl.textContent = "DELIVERED";
    showToast("ROUTE CLEAR");
    setObjective("ROUTE CLEAR");
    hintEl.textContent = "";

    const best = readBest(mode);
    const isNew = best === null || runTime < best;
    if (isNew) writeBest(mode, runTime);
    const shown = readBest(mode) ?? runTime;
    resultBestEl.textContent = formatTime(shown);
    resultNoteEl.hidden = !isNew;
    beep(440, 0.08, "sine");
    window.setTimeout(() => beep(660, 0.1, "sine"), 90);
    window.setTimeout(() => beep(880, 0.12, "sine"), 180);
  } else {
    resultKickerEl.textContent = "Time Up";
    resultKickerEl.classList.add("is-fail");
    resultTitleEl.textContent = "FAILED";
    showToast("TIME UP");
    setObjective("FAILED");
    hintEl.textContent = "";
    const best = readBest(mode);
    resultBestEl.textContent = best === null ? "—" : formatTime(best);
    resultNoteEl.hidden = true;
    beep(220, 0.12, "sawtooth");
    window.setTimeout(() => beep(160, 0.16, "sawtooth"), 110);
  }

  refreshBestHud();
  resultEl.hidden = false;
  clearKeys();
}

function updateGuide() {
  if (awaitingMode || finished) {
    guide.visible = false;
    return;
  }

  const target = currentTarget();
  if (!target) {
    guide.visible = false;
    return;
  }

  guide.visible = true;
  up.copy(courier.root.position).normalize();
  tmp.copy(target).sub(courier.root.position).projectOnPlane(up);
  if (tmp.lengthSq() < 1e-6) {
    guide.visible = false;
    return;
  }
  tmp.normalize();

  guide.position.copy(courier.root.position).addScaledVector(up, 1.2).addScaledVector(tmp, 0.9);
  alignObject(guide, up, tmp);
  if (!reduceMotion) {
    guide.scale.setScalar(0.9 + Math.sin(clock.elapsedTime * 4) * 0.1);
  }
}

function updateEdgeArrow() {
  if (awaitingMode || finished) {
    edgeEl.hidden = true;
    return;
  }

  const target = currentTarget();
  if (!target) {
    edgeEl.hidden = true;
    return;
  }

  ndc.copy(target).project(camera);
  const onScreen =
    ndc.z > -1 && ndc.z < 1 && Math.abs(ndc.x) < 0.82 && Math.abs(ndc.y) < 0.78;

  if (onScreen) {
    if (!edgeEl.hidden) edgeEl.hidden = true;
    return;
  }

  const x = THREE.MathUtils.clamp(ndc.x, -0.86, 0.86);
  const y = THREE.MathUtils.clamp(ndc.y, -0.72, 0.78);
  const px = Math.round((x * 0.5 + 0.5) * window.innerWidth);
  const py = Math.round((-y * 0.5 + 0.5) * window.innerHeight);
  const angle = Math.atan2(ndc.x, ndc.y);
  const key = `${px}|${py}|${angle.toFixed(2)}`;
  if (key === lastEdgeKey && !edgeEl.hidden) return;
  lastEdgeKey = key;

  edgeEl.hidden = false;
  edgeEl.style.left = `${px}px`;
  edgeEl.style.top = `${py}px`;
  edgeEl.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
}

function updateProximity() {
  if (awaitingMode || finished) {
    if (!proximityEl.hidden) proximityEl.hidden = true;
    return;
  }

  const target = currentTarget();
  if (!target) {
    if (!proximityEl.hidden) proximityEl.hidden = true;
    return;
  }

  const distSq = courier.root.position.distanceToSquared(target);
  const near = distSq < NEAR_RANGE * NEAR_RANGE && distSq > (PICK_RANGE * 0.85) ** 2;
  if (near) {
    const text = carrying ? "靠近即可送达" : "靠近即可拾取";
    if (proximityEl.hidden || proximityEl.textContent !== text) {
      proximityEl.hidden = false;
      proximityEl.textContent = text;
    }
  } else if (!proximityEl.hidden) {
    proximityEl.hidden = true;
  }
}

function currentTarget(): THREE.Vector3 | null {
  if (carrying) {
    const held = jobs.find((j) => j.held);
    return held ? held.dropMesh.position : null;
  }
  const next = jobs.find((j) => !j.done && !j.held);
  return next ? next.pickupMesh.position : null;
}

function refreshJobVisibility() {
  let shownPickup = false;
  for (const job of jobs) {
    if (job.done) {
      hideJob(job);
      continue;
    }
    if (carrying) {
      const showDrop = job.held;
      job.pickupMesh.visible = false;
      job.pickupRing.visible = false;
      job.dropMesh.visible = showDrop;
      job.dropLight.visible = showDrop;
      job.dropRing.visible = showDrop;
    } else {
      const showPick = !shownPickup;
      if (showPick) shownPickup = true;
      job.pickupMesh.visible = showPick;
      job.pickupRing.visible = showPick;
      job.dropMesh.visible = false;
      job.dropLight.visible = false;
      job.dropRing.visible = false;
    }
  }
}

function hideJob(job: Job) {
  job.pickupMesh.visible = false;
  job.pickupRing.visible = false;
  job.dropMesh.visible = false;
  job.dropLight.visible = false;
  job.dropRing.visible = false;
}

function pulseMarkers(t: number) {
  for (const job of jobs) {
    if (job.done) continue;
    const s = 1 + Math.sin(t * 3.2 + job.id) * 0.1;
    if (job.pickupMesh.visible) {
      job.pickupMesh.scale.setScalar(s);
      job.pickupRing.scale.setScalar(1.15 + Math.sin(t * 2.6 + job.id) * 0.12);
    }
    if (job.dropLight.visible) {
      job.dropLight.scale.set(1, 1 + Math.sin(t * 2.4 + job.id) * 0.18, 1);
      shared.beamMat.opacity = 0.5 + Math.sin(t * 3 + job.id) * 0.14;
      shared.beamHaloMat.opacity = 0.18 + Math.sin(t * 2.7 + job.id) * 0.08;
      job.dropRing.scale.setScalar(1.2 + Math.sin(t * 2.8 + job.id) * 0.15);
    }
  }
}

function spinClouds(dt: number) {
  tmp2.set(0, 1, 0);
  for (const cloud of clouds) {
    cloud.position.applyAxisAngle(tmp2, dt * 0.05);
    cloud.position.setLength(cloud.userData.orbitR as number);
  }
}

function resetRun(announce: boolean) {
  if (!currentMode || awaitingMode) return;

  delivered = 0;
  carrying = false;
  finished = false;
  started = false;
  runTime = 0;
  lastTimerSec = -1;
  idleHintAt = 3.5;
  speed = 0;
  camVel.set(0, 0, 0);
  fovPunch = 0;
  facing.set(0, 0, 1);
  lastEdgeKey = "";
  sprintToggle = false;
  sprintBtn.classList.remove("is-on");
  sprintBtn.setAttribute("aria-pressed", "false");
  resetStick();
  courier.parcel.visible = false;
  courier.bob.position.y = 0;
  courier.bob.rotation.z = 0;
  resultEl.hidden = true;
  edgeEl.hidden = true;
  proximityEl.hidden = true;
  timerEl.classList.remove("is-urgent");

  const goals = goalCount();
  scoreEl.textContent = `0 / ${goals}`;
  if (currentMode === "timed") {
    timerEl.textContent = formatTime(TIME_LIMIT);
  } else {
    timerEl.textContent = "0:00";
  }
  modeTagEl.textContent = MODE_META[currentMode].tag;
  setObjective("FIND YELLOW PACKAGE");
  const touchHint = window.matchMedia("(hover: none), (max-width: 820px)").matches;
  hintEl.textContent =
    currentMode === "timed"
      ? `限时 ${TIME_LIMIT}s · 黄块拾取 · 橙柱送达`
      : "黄块 = 包裹 · 橙柱 = 送达点";
  if (!touchHint) {
    hintEl.textContent += " · WASD + Shift";
  }

  for (const job of jobs) {
    scene.remove(job.pickupMesh, job.pickupRing, job.dropMesh, job.dropLight, job.dropRing);
  }
  jobs = createJobs();
  refreshJobVisibility();

  placeOnSphere(courier.root, worldY, facing);
  faceFirstTarget();
  camera.position
    .copy(courier.root.position)
    .addScaledVector(up.copy(courier.root.position).normalize(), 3.7)
    .addScaledVector(facing, -5.1);
  camera.up.copy(courier.root.position).normalize();
  camera.fov = FOV_BASE;
  lastFov = FOV_BASE;
  camera.updateProjectionMatrix();
  camera.lookAt(courier.root.position);
  clearKeys();
  refreshBestHud();
  resultNoteEl.hidden = true;
  showCoach(touchHint);

  if (announce) {
    beep(360, 0.05, "triangle");
    showToast(currentMode === "timed" ? "GO · 105s" : "GO · FOLLOW GREEN");
  }
}

function createJobs(): Job[] {
  if (!currentMode) return [];

  const classicSeeds = [
    { pick: latLon(18, -35), drop: latLon(-12, 55) },
    { pick: latLon(-28, 140), drop: latLon(32, -120) },
    { pick: latLon(42, 80), drop: latLon(-40, -20) },
  ];
  const challengeSeeds = [
    { pick: latLon(8, -70), drop: latLon(-35, 25) },
    { pick: latLon(-18, 95), drop: latLon(40, -150) },
    { pick: latLon(55, 20), drop: latLon(-48, 160) },
    { pick: latLon(-5, -170), drop: latLon(22, 60) },
  ];
  const seeds = currentMode === "challenge" ? challengeSeeds : classicSeeds;

  return seeds.map((s, id) => {
    const pickupMesh = new THREE.Mesh(shared.pickGeo, shared.pickMat);
    const pickupRing = new THREE.Mesh(shared.pickRingGeo, shared.pickRingMat);
    placeOnSphere(pickupMesh, s.pick, tangentOf(s.pick));
    placeRing(pickupRing, s.pick);
    scene.add(pickupMesh, pickupRing);

    const dropMesh = new THREE.Mesh(shared.dropGeo, shared.dropMat);
    const dropRing = new THREE.Mesh(shared.dropRingGeo, shared.dropRingMat);
    const dropLight = new THREE.Mesh(shared.beamGeo, shared.beamMat);
    const beamHalo = new THREE.Mesh(shared.beamHaloGeo, shared.beamHaloMat);
    dropLight.add(beamHalo);
    placeOnSphere(dropMesh, s.drop, tangentOf(s.drop));
    placeRing(dropRing, s.drop);
    const n = tmp3.copy(s.drop).normalize();
    dropLight.position.copy(n).multiplyScalar(PLANET_R + 1.4);
    alignObject(dropLight, n, tangentOf(s.drop));
    dropLight.quaternion.copy(qAlign);
    scene.add(dropMesh, dropRing, dropLight);

    return {
      id,
      pickupMesh,
      pickupRing,
      dropMesh,
      dropLight,
      dropRing,
      held: false,
      done: false,
    };
  });
}

function tangentOf(n: THREE.Vector3) {
  tmp2.copy(n).cross(worldY);
  if (tmp2.lengthSq() < 1e-6) tmp2.copy(n).cross(tmp.set(1, 0, 0));
  return tmp2.normalize().clone();
}

function markerMat(color: string) {
  return new THREE.MeshStandardMaterial({
    color,
    flatShading: true,
    emissive: color,
    emissiveIntensity: 0.45,
    roughness: 0.4,
  });
}

function ringMat(color: string) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

function placeRing(ring: THREE.Mesh, normal: THREE.Vector3) {
  const n = tmp.copy(normal).normalize();
  ring.position.copy(n).multiplyScalar(PLANET_R + 0.06);
  ring.lookAt(0, 0, 0);
}

function makeGuide() {
  const group = new THREE.Group();

  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.4, 5),
    new THREE.MeshBasicMaterial({ color: "#7dffb3" }),
  );
  cone.rotation.x = Math.PI / 2;

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.18, 0.26, LEAN ? 12 : 20),
    new THREE.MeshBasicMaterial({
      color: "#7dffb3",
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  ring.position.z = -0.08;
  ring.rotation.y = Math.PI / 2;

  group.add(cone, ring);
  return group;
}

function buildCourier() {
  const root = new THREE.Group();
  const bob = new THREE.Group();
  root.add(bob);

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.22, 0.28, 4, 8),
    new THREE.MeshStandardMaterial({
      color: "#f0f4ff",
      flatShading: true,
      roughness: 0.55,
    }),
  );
  body.position.y = 0.35;
  bob.add(body);

  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, LEAN ? 8 : 10, LEAN ? 6 : 8),
    new THREE.MeshStandardMaterial({
      color: "#ff6b3d",
      flatShading: true,
      roughness: 0.4,
    }),
  );
  helmet.position.y = 0.72;
  bob.add(helmet);

  const visor = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, LEAN ? 6 : 8, LEAN ? 4 : 6, 0, Math.PI * 2, 0, Math.PI * 0.55),
    new THREE.MeshStandardMaterial({
      color: "#1a2430",
      flatShading: true,
      roughness: 0.25,
      metalness: 0.35,
    }),
  );
  visor.position.set(0, 0.72, 0.12);
  visor.rotation.x = Math.PI * 0.15;
  bob.add(visor);

  const backpack = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.32, 0.16),
    new THREE.MeshStandardMaterial({
      color: "#c8d2e0",
      flatShading: true,
      roughness: 0.6,
    }),
  );
  backpack.position.set(0, 0.4, -0.22);
  bob.add(backpack);

  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.28, 5),
    new THREE.MeshStandardMaterial({
      color: "#dfe7f2",
      flatShading: true,
      roughness: 0.5,
    }),
  );
  antenna.position.set(0.08, 0.92, -0.02);
  bob.add(antenna);

  const antennaTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 6, 6),
    new THREE.MeshStandardMaterial({
      color: "#ffd35a",
      flatShading: true,
      emissive: "#ffd35a",
      emissiveIntensity: 0.55,
      roughness: 0.35,
    }),
  );
  antennaTip.position.set(0.08, 1.08, -0.02);
  bob.add(antennaTip);

  const parcel = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.22, 0.28),
    new THREE.MeshStandardMaterial({
      color: "#ffd35a",
      flatShading: true,
      roughness: 0.6,
    }),
  );
  parcel.position.set(0.32, 0.42, 0);
  parcel.visible = false;
  bob.add(parcel);

  return { root, bob, parcel };
}

function makeDust() {
  const count = LEAN ? 24 : 40;
  const positions = new Float32Array(count * 3);
  const ages = new Float32Array(count);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: "#d8ecff",
    size: 0.12,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;

  let cursor = 0;
  const emit = (strength: number) => {
    up.copy(courier.root.position).normalize();
    const n = LEAN ? 2 : 3;
    for (let i = 0; i < n; i++) {
      const i3 = cursor * 3;
      const side = (Math.random() - 0.5) * 0.35;
      tmp
        .copy(courier.root.position)
        .addScaledVector(up, 0.1)
        .addScaledVector(facing, -0.25)
        .addScaledVector(
          tmp2.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
          side,
        );
      positions[i3] = tmp.x;
      positions[i3 + 1] = tmp.y;
      positions[i3 + 2] = tmp.z;
      ages[cursor] = 0.28 + strength * 0.12;
      cursor = (cursor + 1) % count;
    }
    geo.attributes.position.needsUpdate = true;
  };

  return { points, positions, ages, emit, count };
}

function updateDust(dt: number) {
  dustCooldown -= dt;
  if (speed > 1.2 && dustCooldown <= 0) {
    dust.emit(speed / SPRINT_SPEED);
    dustCooldown = LEAN ? 0.08 : 0.045;
  }

  let alive = false;
  for (let i = 0; i < dust.count; i++) {
    if (dust.ages[i] <= 0) continue;
    dust.ages[i] -= dt;
    alive = true;
    const i3 = i * 3;
    dust.positions[i3] *= 1.001;
    dust.positions[i3 + 1] *= 1.001;
    dust.positions[i3 + 2] *= 1.001;
  }
  if (alive) dust.points.geometry.attributes.position.needsUpdate = true;
  const mat = dust.points.material;
  if (mat instanceof THREE.PointsMaterial) {
    mat.opacity = THREE.MathUtils.clamp(speed / SPRINT_SPEED, 0.12, 0.6);
  }
}

function burstDust(strength: number) {
  if (reduceMotion) return;
  for (let i = 0; i < 2; i++) dust.emit(strength);
}

function placeOnSphere(obj: THREE.Object3D, normal: THREE.Vector3, faceHint: THREE.Vector3) {
  const n = tmp.copy(normal).normalize();
  obj.position.copy(n).multiplyScalar(SURFACE);
  alignObject(obj, n, faceHint);
}

function alignToSurface(obj: THREE.Object3D, faceDir: THREE.Vector3) {
  alignObject(obj, tmp.copy(obj.position).normalize(), faceDir);
}

function alignObject(obj: THREE.Object3D, normal: THREE.Vector3, faceDir: THREE.Vector3) {
  const z = tmp2.copy(faceDir).projectOnPlane(normal);
  if (z.lengthSq() < 1e-6) z.set(0, 0, 1).projectOnPlane(normal);
  z.normalize();
  const x = tmp3.crossVectors(z, normal).normalize();
  mAlign.makeBasis(x, normal, z);
  qAlign.setFromRotationMatrix(mAlign);
  obj.quaternion.slerp(qAlign, 0.28);
}

function latLon(latDeg: number, lonDeg: number) {
  const lat = THREE.MathUtils.degToRad(latDeg);
  const lon = THREE.MathUtils.degToRad(lonDeg);
  const cosLat = Math.cos(lat);
  return new THREE.Vector3(
    cosLat * Math.cos(lon),
    Math.sin(lat),
    cosLat * Math.sin(lon),
  ).normalize();
}

function addStars() {
  const count = LEAN ? 180 : 420;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const v = latLon(-80 + Math.random() * 160, Math.random() * 360);
    const r = 22 + Math.random() * 28;
    positions[i3] = v.x * r;
    positions[i3 + 1] = v.y * r;
    positions[i3 + 2] = v.z * r;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const stars = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: "#d7e6f5",
      size: LEAN ? 0.08 : 0.1,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  scene.add(stars);
}

function addLandPatches() {
  const tones = ["#3f9a6e", "#4aad78", "#2f8a5f", "#5cb87a", "#358866"];
  const count = LEAN ? 10 : 16;
  for (let i = 0; i < count; i++) {
    const mat = new THREE.MeshStandardMaterial({
      color: tones[i % tones.length],
      flatShading: true,
      roughness: 0.9,
    });
    const patch = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.55 + (i % 5) * 0.12, 0),
      mat,
    );
    const n = latLon(-60 + ((i * 47) % 120), (i * 79) % 360);
    patch.position.copy(n).multiplyScalar(PLANET_R * 0.98);
    patch.lookAt(0, 0, 0);
    patch.rotateX(Math.PI / 2);
    planet.add(patch);
  }
}

function addLandmarks() {
  const bodyMat = new THREE.MeshStandardMaterial({
    color: "#dfe7f2",
    flatShading: true,
    roughness: 0.65,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: "#ff6b3d",
    flatShading: true,
    roughness: 0.45,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: "#2b3a48",
    flatShading: true,
    roughness: 0.7,
  });

  placeLandmark(latLon(8, 10), (root) => {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.35, 0.45), bodyMat);
    tower.position.y = 0.68;
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.42, 5), roofMat);
    cap.position.y = 1.52;
    root.add(tower, cap);
  });

  placeLandmark(latLon(-22, -95), (root) => {
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.7), darkMat);
    base.position.y = 0.18;
    const shed = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.48, 0.55), bodyMat);
    shed.position.y = 0.52;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.12, 0.68), roofMat);
    roof.position.y = 0.82;
    root.add(base, shed, roof);
  });

  placeLandmark(latLon(35, 155), (root) => {
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 8), darkMat);
    pad.position.y = 0.06;
    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.5),
      bodyMat,
    );
    dish.position.y = 0.28;
    dish.rotation.x = Math.PI;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.55, 6), roofMat);
    pole.position.y = 0.45;
    root.add(pad, dish, pole);
  });
}

function placeLandmark(normal: THREE.Vector3, build: (root: THREE.Group) => void) {
  const root = new THREE.Group();
  build(root);
  const n = normal.clone().normalize();
  root.position.copy(n).multiplyScalar(PLANET_R + 0.02);
  alignObject(root, n, tangentOf(n));
  root.quaternion.copy(qAlign);
  scene.add(root);
}

function addClouds() {
  const mat = new THREE.MeshStandardMaterial({
    color: "#eef6ff",
    flatShading: true,
    transparent: true,
    opacity: 0.78,
    roughness: 1,
  });
  const list: THREE.Mesh[] = [];
  const count = LEAN ? 5 : 8;
  for (let i = 0; i < count; i++) {
    const cloud = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.35 + (i % 3) * 0.1, 0),
      mat,
    );
    const n = latLon(-40 + ((i * 53) % 80), 20 + i * 44);
    const orbitR = PLANET_R + 0.9 + (i % 4) * 0.08;
    cloud.position.copy(n).multiplyScalar(orbitR);
    cloud.userData.orbitR = orbitR;
    scene.add(cloud);
    list.push(cloud);
  }
  return list;
}

function onKeyDown(e: KeyboardEvent) {
  if (!booted || awaitingMode) return;
  if (e.code === "KeyR" && !e.repeat) {
    e.preventDefault();
    resetRun(true);
    return;
  }
  if (isGameKey(e.code)) e.preventDefault();
  setKey(e.code, true);
}

function onKeyUp(e: KeyboardEvent) {
  if (isGameKey(e.code)) e.preventDefault();
  setKey(e.code, false);
}

function isGameKey(code: string) {
  return (
    code === "KeyW" ||
    code === "KeyA" ||
    code === "KeyS" ||
    code === "KeyD" ||
    code === "ArrowUp" ||
    code === "ArrowDown" ||
    code === "ArrowLeft" ||
    code === "ArrowRight" ||
    code === "ShiftLeft" ||
    code === "ShiftRight" ||
    code === "KeyR"
  );
}

function setKey(code: string, down: boolean) {
  if (code === "KeyW" || code === "ArrowUp") keys.forward = down;
  if (code === "KeyS" || code === "ArrowDown") keys.back = down;
  if (code === "KeyA" || code === "ArrowLeft") keys.left = down;
  if (code === "KeyD" || code === "ArrowRight") keys.right = down;
  if (code === "ShiftLeft" || code === "ShiftRight") keys.sprint = down;
}

function clearKeys() {
  keys.forward = keys.back = keys.left = keys.right = keys.sprint = false;
  if (!sprintToggle) sprintBtn.classList.remove("is-on");
}

function resetStick() {
  stick.active = false;
  stick.pointerId = -1;
  stick.x = 0;
  stick.y = 0;
  stickKnobEl.style.transform = "translate(0px, 0px)";
}

function showCoach(touchHint: boolean) {
  coachEl.textContent = touchHint
    ? "绿箭头指路 · 左摇杆移动 · 点右下冲刺"
    : "绿箭头指路 · WASD 移动 · Shift 冲刺";
  coachEl.hidden = false;
  coachTimer = 5;
}

function hideCoach() {
  coachTimer = 0;
  coachEl.hidden = true;
}

function faceFirstTarget() {
  const target = currentTarget();
  if (!target) return;
  up.copy(courier.root.position).normalize();
  tmp.copy(target).sub(courier.root.position).projectOnPlane(up);
  if (tmp.lengthSq() < 1e-6) return;
  facing.copy(tmp.normalize());
  alignObject(courier.root, up, facing);
  courier.root.quaternion.copy(qAlign);
}

function bindTouch() {
  const maxR = () => stickBaseEl.clientWidth * 0.38;

  const applyStick = (clientX: number, clientY: number) => {
    const rect = stickBaseEl.getBoundingClientRect();
    const cx = rect.left + rect.width * 0.5;
    const cy = rect.top + rect.height * 0.5;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const r = maxR();
    const mag = Math.hypot(dx, dy);
    if (mag > r && mag > 0) {
      dx = (dx / mag) * r;
      dy = (dy / mag) * r;
    }
    stick.x = r > 0 ? dx / r : 0;
    stick.y = r > 0 ? -dy / r : 0;
    stickKnobEl.style.transform = `translate(${dx}px, ${dy}px)`;
  };

  const endStick = (pointerId: number) => {
    if (stick.pointerId !== pointerId) return;
    resetStick();
  };

  stickBaseEl.addEventListener("pointerdown", (e) => {
    if (awaitingMode || finished) return;
    e.preventDefault();
    stick.active = true;
    stick.pointerId = e.pointerId;
    stickBaseEl.setPointerCapture(e.pointerId);
    applyStick(e.clientX, e.clientY);
  });
  stickBaseEl.addEventListener("pointermove", (e) => {
    if (!stick.active || stick.pointerId !== e.pointerId) return;
    e.preventDefault();
    applyStick(e.clientX, e.clientY);
  });
  stickBaseEl.addEventListener("pointerup", (e) => endStick(e.pointerId));
  stickBaseEl.addEventListener("pointercancel", (e) => endStick(e.pointerId));
  stickBaseEl.addEventListener("lostpointercapture", () => {
    if (stick.active) resetStick();
  });

  const toggleSprint = () => {
    if (awaitingMode || finished) return;
    sprintToggle = !sprintToggle;
    sprintBtn.classList.toggle("is-on", sprintToggle);
    sprintBtn.setAttribute("aria-pressed", sprintToggle ? "true" : "false");
    beep(sprintToggle ? 480 : 320, 0.04, "triangle");
  };

  sprintBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    toggleSprint();
  });
}

function setObjective(text: string) {
  objectiveEl.textContent = text;
}

function showToast(text: string) {
  toastEl.hidden = false;
  toastEl.textContent = text;
  toastEl.style.animation = "none";
  void toastEl.offsetWidth;
  toastEl.style.animation = "";
  toastTimer = 1.15;
}

function formatTime(sec: number) {
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function bestKey(mode: ModeId) {
  return `orb-courier-best-${mode}`;
}

function readBest(mode: ModeId): number | null {
  const raw = localStorage.getItem(bestKey(mode));
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function writeBest(mode: ModeId, sec: number) {
  localStorage.setItem(bestKey(mode), String(sec));
}

function refreshBestHud() {
  if (!currentMode) {
    bestEl.textContent = "BEST —";
    return;
  }
  const best = readBest(currentMode);
  bestEl.textContent = best === null ? "BEST —" : `BEST ${formatTime(best)}`;
}

function beep(freq: number, dur: number, type: OscillatorType) {
  if (reduceMotion) return;
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    const t0 = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.05, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  } catch {
    // Autoplay / AudioContext unsupported — ignore.
  }
}

function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  lastFov = camera.fov;
  renderer.setPixelRatio(pixelBudget());
  renderer.setSize(w, h);
}

function onVisibility() {
  if (!document.hidden) {
    clock.getDelta();
  }
}

function pixelBudget() {
  const dpr = window.devicePixelRatio || 1;
  if (LEAN || window.innerWidth < 720) return Math.min(dpr, 1.25);
  return Math.min(dpr, 2);
}

function isLeanDevice() {
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return (
    window.innerWidth < 720 ||
    (navigator.hardwareConcurrency ?? 8) <= 4 ||
    (typeof mem === "number" && mem <= 4)
  );
}

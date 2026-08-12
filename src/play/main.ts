import "./style.css";
import * as THREE from "three";

const PLANET_R = 5;
const WALK_SPEED = 2.35;
const SPRINT_SPEED = 4.15;
const CAM_LERP = 7.2;
const FOV_BASE = 48;
const FOV_SPRINT = 56;
const GOAL_COUNT = 3;
const SURFACE = PLANET_R + 0.18;
const PICK_RANGE = 1.05;
const NEAR_RANGE = 2.4;
const LEAN = isLeanDevice();

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

const canvas = document.querySelector<HTMLCanvasElement>("#c");
const scoreNode = document.querySelector<HTMLParagraphElement>("#score");
const hintNode = document.querySelector<HTMLParagraphElement>("#hint");
const toastNode = document.querySelector<HTMLParagraphElement>("#toast");
const touchNode = document.querySelector<HTMLDivElement>("#touch");
const sprintNode = document.querySelector<HTMLButtonElement>("#sprint");
const restartNode = document.querySelector<HTMLButtonElement>("#restart");
const bootNode = document.querySelector<HTMLDivElement>("#boot");
const hudNode = document.querySelector<HTMLDivElement>("#hud");
const objectiveNode = document.querySelector<HTMLParagraphElement>("#objective");
const proximityNode = document.querySelector<HTMLParagraphElement>("#proximity");
const timerNode = document.querySelector<HTMLParagraphElement>("#timer");
const edgeNode = document.querySelector<HTMLDivElement>("#edge");
const resultNode = document.querySelector<HTMLDivElement>("#result");
const resultParcels = document.querySelector<HTMLElement>("#result-parcels");
const resultTime = document.querySelector<HTMLElement>("#result-time");

if (
  !canvas ||
  !scoreNode ||
  !hintNode ||
  !toastNode ||
  !touchNode ||
  !sprintNode ||
  !restartNode ||
  !bootNode ||
  !hudNode ||
  !objectiveNode ||
  !proximityNode ||
  !timerNode ||
  !edgeNode ||
  !resultNode ||
  !resultParcels ||
  !resultTime
) {
  throw new Error("play HUD mounts missing");
}

const scoreEl = scoreNode;
const hintEl = hintNode;
const toastEl = toastNode;
const touchEl = touchNode;
const sprintBtn = sprintNode;
const restartBtn = restartNode;
const bootEl = bootNode;
const hudEl = hudNode;
const objectiveEl = objectiveNode;
const proximityEl = proximityNode;
const timerEl = timerNode;
const edgeEl = edgeNode;
const resultEl = resultNode;
const resultParcelsEl = resultParcels;
const resultTimeEl = resultTime;

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
scene.background = new THREE.Color("#1c3348");
scene.fog = new THREE.Fog("#1c3348", 12, 34);

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
    color: "#3d8f6e",
    flatShading: true,
    roughness: 0.82,
    metalness: 0.05,
  }),
);
scene.add(planet);

const sea = new THREE.Mesh(
  new THREE.IcosahedronGeometry(PLANET_R * 0.992, LEAN ? 1 : 2),
  new THREE.MeshStandardMaterial({
    color: "#2f6f9a",
    flatShading: true,
    roughness: 0.55,
    metalness: 0.12,
  }),
);
sea.scale.setScalar(0.97);
scene.add(sea);

const clouds = addClouds();
addLandPatches();

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
    color: "#ff6b3d",
    transparent: true,
    opacity: 0.45,
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
let jobs = createJobs();
let booted = false;
let lastFov = FOV_BASE;
let lastTimerSec = -1;
let dustCooldown = 0;
let lastEdgeKey = "";
let reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

resetRun(false);

window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);
window.addEventListener("resize", onResize);
window.addEventListener("blur", clearKeys);
document.addEventListener("visibilitychange", onVisibility);
restartBtn.addEventListener("click", () => resetRun(true));
bindTouch();

const clock = new THREE.Clock();
requestAnimationFrame(tick);

function tick() {
  requestAnimationFrame(tick);
  if (document.hidden) return;

  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  if (booted && started && !finished) {
    runTime += dt;
    const sec = Math.floor(runTime);
    if (sec !== lastTimerSec) {
      lastTimerSec = sec;
      timerEl.textContent = formatTime(runTime);
    }
    if (runTime > idleHintAt && delivered === 0 && !carrying) {
      hintEl.textContent = "跟着绿色箭头 / 屏幕边缘三角找黄块";
      idleHintAt = Number.POSITIVE_INFINITY;
    }
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
      hudEl.hidden = false;
      window.setTimeout(() => bootEl.remove(), 480);
    });
  }
}

function updateMovement(dt: number) {
  if (finished) return;

  up.copy(courier.root.position).normalize();
  camera.getWorldDirection(camForward);
  forward.copy(camForward).projectOnPlane(up).normalize();
  if (forward.lengthSq() < 1e-6) {
    forward.set(0, 0, 1).projectOnPlane(up).normalize();
  }
  right.crossVectors(forward, up).normalize();

  move.set(0, 0, 0);
  if (keys.forward) move.add(forward);
  if (keys.back) move.sub(forward);
  if (keys.left) move.sub(right);
  if (keys.right) move.add(right);

  if (move.lengthSq() > 0) started = true;

  const wantSprint = keys.sprint && move.lengthSq() > 0;
  const targetSpeed = move.lengthSq() > 0 ? (wantSprint ? SPRINT_SPEED : WALK_SPEED) : 0;
  speed = THREE.MathUtils.damp(speed, targetSpeed, 9, dt);

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

  const fovTarget = THREE.MathUtils.lerp(FOV_BASE, FOV_SPRINT, sprintT);
  camera.fov = THREE.MathUtils.damp(camera.fov, fovTarget, 8, dt);
  if (Math.abs(camera.fov - lastFov) > 0.05) {
    lastFov = camera.fov;
    camera.updateProjectionMatrix();
  }
}

function updateJobs() {
  if (finished) return;

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
        scoreEl.textContent = `${delivered} / ${GOAL_COUNT}`;

        if (delivered >= GOAL_COUNT) {
          finishRun();
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

function finishRun() {
  finished = true;
  guide.visible = false;
  edgeEl.hidden = true;
  proximityEl.hidden = true;
  showToast("ROUTE CLEAR");
  setObjective("ROUTE CLEAR");
  hintEl.textContent = "";
  resultParcelsEl.textContent = `${GOAL_COUNT} / ${GOAL_COUNT}`;
  resultTimeEl.textContent = formatTime(runTime);
  resultEl.hidden = false;
  clearKeys();
}

function updateGuide() {
  if (finished) {
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
  if (finished) {
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
  if (finished) {
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
      shared.beamMat.opacity = 0.42 + Math.sin(t * 3 + job.id) * 0.14;
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
  delivered = 0;
  carrying = false;
  finished = false;
  started = false;
  runTime = 0;
  lastTimerSec = -1;
  idleHintAt = 8;
  speed = 0;
  camVel.set(0, 0, 0);
  facing.set(0, 0, 1);
  lastEdgeKey = "";
  courier.parcel.visible = false;
  courier.bob.position.y = 0;
  courier.bob.rotation.z = 0;
  resultEl.hidden = true;
  edgeEl.hidden = true;
  proximityEl.hidden = true;
  scoreEl.textContent = `0 / ${GOAL_COUNT}`;
  timerEl.textContent = "0:00";
  setObjective("FIND YELLOW PACKAGE");
  hintEl.textContent = "黄块 = 包裹 · 橙柱 = 送达点 · Shift 冲刺";

  for (const job of jobs) {
    scene.remove(job.pickupMesh, job.pickupRing, job.dropMesh, job.dropLight, job.dropRing);
  }
  jobs = createJobs();
  refreshJobVisibility();

  placeOnSphere(courier.root, worldY, facing);
  camera.position
    .copy(courier.root.position)
    .addScaledVector(up.copy(worldY), 3.7)
    .addScaledVector(facing, -5.1);
  camera.up.copy(worldY);
  camera.fov = FOV_BASE;
  lastFov = FOV_BASE;
  camera.updateProjectionMatrix();
  camera.lookAt(courier.root.position);
  clearKeys();

  if (announce) showToast("NEW ROUTE");
}

function createJobs(): Job[] {
  const seeds = [
    { pick: latLon(18, -35), drop: latLon(-12, 55) },
    { pick: latLon(-28, 140), drop: latLon(32, -120) },
    { pick: latLon(42, 80), drop: latLon(-40, -20) },
  ];

  return seeds.map((s, id) => {
    const pickupMesh = new THREE.Mesh(shared.pickGeo, shared.pickMat);
    const pickupRing = new THREE.Mesh(shared.pickRingGeo, shared.pickRingMat);
    placeOnSphere(pickupMesh, s.pick, tangentOf(s.pick));
    placeRing(pickupRing, s.pick);
    scene.add(pickupMesh, pickupRing);

    const dropMesh = new THREE.Mesh(shared.dropGeo, shared.dropMat);
    const dropRing = new THREE.Mesh(shared.dropRingGeo, shared.dropRingMat);
    const dropLight = new THREE.Mesh(shared.beamGeo, shared.beamMat);
    placeOnSphere(dropMesh, s.drop, tangentOf(s.drop));
    placeRing(dropRing, s.drop);
    const n = tmp3.copy(s.drop).normalize();
    dropLight.position.copy(n).multiplyScalar(PLANET_R + 1.4);
    alignObject(dropLight, n, tangentOf(s.drop));
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
  const g = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.4, 5),
    new THREE.MeshBasicMaterial({ color: "#7dffb3" }),
  );
  g.rotation.x = Math.PI / 2;
  return g;
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

function addLandPatches() {
  const mat = new THREE.MeshStandardMaterial({
    color: "#5cb87a",
    flatShading: true,
    roughness: 0.9,
  });
  const count = LEAN ? 10 : 16;
  // Fixed-ish distribution so the planet looks stable across reloads.
  for (let i = 0; i < count; i++) {
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
  if (!booted) return;
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
  touchEl.querySelectorAll(".is-on").forEach((el) => el.classList.remove("is-on"));
  sprintBtn.classList.remove("is-on");
}

function bindTouch() {
  const buttons = [
    ...touchEl.querySelectorAll<HTMLButtonElement>("button[data-dir]"),
    sprintBtn,
  ];

  const map: Record<string, keyof typeof keys> = {
    forward: "forward",
    back: "back",
    left: "left",
    right: "right",
    sprint: "sprint",
  };

  buttons.forEach((btn) => {
    const dir = btn.dataset.dir;
    if (!dir || !(dir in map)) return;
    const key = map[dir];

    const on = () => {
      keys[key] = true;
      btn.classList.add("is-on");
    };
    const off = () => {
      keys[key] = false;
      btn.classList.remove("is-on");
    };

    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      btn.setPointerCapture(e.pointerId);
      on();
    });
    btn.addEventListener("pointerup", off);
    btn.addEventListener("pointercancel", off);
    btn.addEventListener("lostpointercapture", off);
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

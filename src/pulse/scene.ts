import * as THREE from "three";
import type { Bands } from "./audio";

export class PulseScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly camera: THREE.PerspectiveCamera;
  private scene = new THREE.Scene();
  private stage = new THREE.Group();
  private mainRing: THREE.Mesh;
  private mainMat: THREE.MeshStandardMaterial;
  private innerRing: THREE.Mesh;
  private innerMat: THREE.MeshStandardMaterial;
  private rimGlow: THREE.Mesh;
  private rimMat: THREE.MeshStandardMaterial;
  private segments: THREE.Mesh[] = [];
  private segMats: THREE.MeshStandardMaterial[] = [];
  private sparks: THREE.Points;
  private sparkMat: THREE.PointsMaterial;
  private baseCam = new THREE.Vector3(0, 3.4, 8.6);
  private look = new THREE.Vector3(0, 0.35, 0);
  private reduceMotion: boolean;
  private lean: boolean;
  private idleSpin = 0;

  constructor(canvas: HTMLCanvasElement, lean: boolean, reduceMotion: boolean) {
    this.lean = lean;
    this.reduceMotion = reduceMotion;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !lean,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor("#0B1214");
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lean ? 1.25 : 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene.background = new THREE.Color("#0B1214");
    this.scene.fog = new THREE.Fog("#0B1214", 10, 28);

    this.scene.add(new THREE.HemisphereLight("#c8fff0", "#0b1214", 0.7));
    const key = new THREE.DirectionalLight("#f0a35e", 0.7);
    key.position.set(5, 8, 4);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight("#3ee0b8", 0.25);
    fill.position.set(-4, 3, -2);
    this.scene.add(fill);

    this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 80);
    this.camera.position.copy(this.baseCam);
    this.camera.lookAt(this.look);

    this.scene.add(this.stage);

    // Stage plate — readable as a performance floor even when silent
    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(3.6, 3.8, 0.18, lean ? 40 : 64),
      new THREE.MeshStandardMaterial({
        color: "#152026",
        roughness: 0.92,
        metalness: 0.08,
        flatShading: true,
      }),
    );
    plate.position.y = -0.05;
    this.stage.add(plate);

    const under = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.7, 0.55, lean ? 24 : 40),
      new THREE.MeshStandardMaterial({
        color: "#10181c",
        roughness: 0.95,
        metalness: 0.05,
        flatShading: true,
      }),
    );
    under.position.y = -0.45;
    this.stage.add(under);

    this.rimMat = new THREE.MeshStandardMaterial({
      color: "#3EE0B8",
      emissive: "#3EE0B8",
      emissiveIntensity: 0.18,
      roughness: 0.4,
      metalness: 0.2,
      flatShading: true,
    });
    this.rimGlow = new THREE.Mesh(
      new THREE.TorusGeometry(3.55, 0.045, 6, lean ? 48 : 80),
      this.rimMat,
    );
    this.rimGlow.rotation.x = Math.PI / 2;
    this.rimGlow.position.y = 0.06;
    this.stage.add(this.rimGlow);

    const segs = lean ? 64 : 96;
    this.mainMat = new THREE.MeshStandardMaterial({
      color: "#3EE0B8",
      emissive: "#3EE0B8",
      emissiveIntensity: 0.28,
      roughness: 0.32,
      metalness: 0.22,
      flatShading: true,
    });
    this.mainRing = new THREE.Mesh(new THREE.TorusGeometry(2.15, 0.16, 10, segs), this.mainMat);
    this.mainRing.rotation.x = Math.PI / 2.35;
    this.mainRing.position.y = 1.35;
    this.stage.add(this.mainRing);

    this.innerMat = new THREE.MeshStandardMaterial({
      color: "#E8F0EE",
      emissive: "#F0A35E",
      emissiveIntensity: 0.2,
      roughness: 0.45,
      metalness: 0.15,
      flatShading: true,
    });
    this.innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.25, 0.055, 8, lean ? 48 : 72),
      this.innerMat,
    );
    this.innerRing.rotation.x = Math.PI / 2.15;
    this.innerRing.position.y = 1.15;
    this.stage.add(this.innerRing);

    // Mid-driven segment posts around the stage — readable even at rest
    const barCount = lean ? 16 : 24;
    const barGeo = new THREE.BoxGeometry(0.08, 1, 0.08);
    for (let i = 0; i < barCount; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: "#3EE0B8",
        emissive: "#3EE0B8",
        emissiveIntensity: 0.12,
        roughness: 0.5,
        flatShading: true,
      });
      const bar = new THREE.Mesh(barGeo, mat);
      const a = (i / barCount) * Math.PI * 2;
      bar.position.set(Math.cos(a) * 3.05, 0.35, Math.sin(a) * 3.05);
      bar.lookAt(0, bar.position.y, 0);
      this.stage.add(bar);
      this.segments.push(bar);
      this.segMats.push(mat);
    }

    const sparkCount = lean ? 48 : 120;
    const sparkPos = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount; i++) {
      const a = (i / sparkCount) * Math.PI * 2;
      const r = 3.7 + (i % 4) * 0.08;
      sparkPos[i * 3] = Math.cos(a) * r;
      sparkPos[i * 3 + 1] = 0.2 + (i % 5) * 0.05;
      sparkPos[i * 3 + 2] = Math.sin(a) * r;
    }
    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
    this.sparkMat = new THREE.PointsMaterial({
      color: "#E8F0EE",
      size: 0.045,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.sparks = new THREE.Points(sparkGeo, this.sparkMat);
    this.stage.add(this.sparks);
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.lean ? 1.25 : 2));
    this.renderer.setSize(w, h);
  }

  update(bands: Bands, dt: number, playing: boolean) {
    const live = playing ? 1 : 0;
    const restAmp = playing ? 1 : 0.22;
    this.idleSpin += dt * (playing ? 0.35 : 0.12);

    if (this.reduceMotion) {
      this.mainRing.rotation.z = this.idleSpin * 0.15;
      this.innerRing.rotation.z = -this.idleSpin * 0.1;
      this.camera.position.copy(this.baseCam);
      this.camera.lookAt(this.look);
      this.renderer.render(this.scene, this.camera);
      return;
    }

    const bass = bands.bass * restAmp;
    const mid = bands.mid * restAmp;
    const high = bands.high * restAmp;
    const beat = bands.beat * live;

    // Main ring: scale + kick + gentle spin; mid twists orientation
    const kick = 1 + bass * 0.28 + beat * 0.2;
    this.mainRing.scale.setScalar(kick);
    this.mainRing.rotation.x = Math.PI / 2.35 + mid * 0.22;
    this.mainRing.rotation.z = this.idleSpin * (0.4 + mid * 1.2);
    this.mainMat.emissiveIntensity = 0.22 + bass * 0.55 + beat * 0.4;

    this.innerRing.rotation.x = Math.PI / 2.15 - mid * 0.18;
    this.innerRing.rotation.z = -this.idleSpin * (0.55 + mid * 0.8);
    this.innerMat.emissiveIntensity = 0.15 + mid * 0.45 + beat * 0.2;

    this.rimMat.emissiveIntensity = 0.12 + bass * 0.35 + high * 0.2;

    // Segment posts — mid drives height undulation around the circle
    const n = this.segments.length;
    for (let i = 0; i < n; i++) {
      const wave = 0.55 + Math.sin(this.idleSpin * 2 + (i / n) * Math.PI * 2) * 0.2;
      const h = wave + mid * 0.95 + bass * 0.25;
      this.segments[i].scale.y = Math.max(0.25, h);
      this.segments[i].position.y = this.segments[i].scale.y * 0.5;
      this.segMats[i].emissiveIntensity = 0.08 + mid * 0.4 + high * 0.15;
    }

    this.sparkMat.opacity = 0.14 + high * 0.7 + beat * 0.15;
    this.sparkMat.size = 0.035 + high * 0.055;
    this.sparks.rotation.y += dt * (0.12 + high * 0.9);

    // Camera punch on bass/beat — still reads as a stage
    this.camera.position.set(
      this.baseCam.x,
      this.baseCam.y + bass * 0.12,
      this.baseCam.z - bass * 0.65 - beat * 0.35,
    );
    this.camera.lookAt(this.look.x, this.look.y + mid * 0.08, this.look.z);

    this.renderer.render(this.scene, this.camera);
  }
}

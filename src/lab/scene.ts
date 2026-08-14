import * as THREE from "three";
import { vertexShader, type SketchDef } from "./sketches/common";

export class LabScene {
  readonly renderer: THREE.WebGLRenderer;
  private camera: THREE.OrthographicCamera;
  private scene = new THREE.Scene();
  private material: THREE.ShaderMaterial;
  private mesh: THREE.Mesh;

  readonly uniforms = {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uPointer: { value: new THREE.Vector2(0.5, 0.5) },
    uReducedMotion: { value: 0 },
  };

  constructor(canvas: HTMLCanvasElement, lean: boolean, sketch: SketchDef) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !lean,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor("#071018");
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lean ? 1.15 : 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: sketch.fragmentShader,
      uniforms: this.uniforms,
      depthTest: false,
      depthWrite: false,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);

    this.resize();
  }

  setSketch(sketch: SketchDef) {
    this.material.fragmentShader = sketch.fragmentShader;
    this.material.needsUpdate = true;
  }

  setPointer(nx: number, ny: number) {
    this.uniforms.uPointer.value.set(
      THREE.MathUtils.clamp(nx, 0, 1),
      THREE.MathUtils.clamp(ny, 0, 1),
    );
  }

  setReducedMotion(on: boolean) {
    this.uniforms.uReducedMotion.value = on ? 1 : 0;
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.uniforms.uResolution.value.set(w, h);
  }

  render(timeSec: number) {
    this.uniforms.uTime.value = timeSec;
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.material.dispose();
    this.mesh.geometry.dispose();
    this.renderer.dispose();
  }
}

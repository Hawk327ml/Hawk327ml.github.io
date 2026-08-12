export type Bands = {
  bass: number;
  mid: number;
  high: number;
  beat: number;
};

const TRACKS = [
  { id: "A", src: "/audio/pulse-a.wav", label: "Pulse A" },
  { id: "B", src: "/audio/pulse-b.wav", label: "Pulse B" },
] as const;

export class AudioTransport {
  readonly tracks = TRACKS;
  trackIndex = 0;

  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private gain: GainNode | null = null;
  private el: HTMLAudioElement | null = null;
  private freq = new Uint8Array(0);
  private smooth: Bands = { bass: 0, mid: 0, high: 0, beat: 0 };
  private prevBass = 0;
  private muted = false;
  private lean: boolean;

  constructor(lean: boolean) {
    this.lean = lean;
  }

  get playing() {
    return !!this.el && !this.el.paused;
  }

  get trackId() {
    return this.tracks[this.trackIndex].id;
  }

  async play() {
    await this.ensureGraph();
    if (!this.el || !this.ctx) return;
    if (this.ctx.state === "suspended") await this.ctx.resume();
    await this.el.play();
  }

  pause() {
    this.el?.pause();
  }

  async toggle() {
    if (this.playing) this.pause();
    else await this.play();
  }

  async nextTrack() {
    const was = this.playing;
    this.trackIndex = (this.trackIndex + 1) % this.tracks.length;
    await this.loadTrack(this.tracks[this.trackIndex].src, was);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.gain) this.gain.gain.value = muted ? 0 : 0.9;
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  sample(): Bands {
    if (!this.analyser) return this.smooth;
    this.analyser.getByteFrequencyData(this.freq);
    const bins = this.freq.length;
    const sr = this.ctx?.sampleRate ?? 44100;
    const hzPerBin = sr / (this.analyser.fftSize);

    const avgRange = (loHz: number, hiHz: number) => {
      const a = Math.max(0, Math.floor(loHz / hzPerBin));
      const b = Math.min(bins - 1, Math.ceil(hiHz / hzPerBin));
      let sum = 0;
      let n = 0;
      for (let i = a; i <= b; i++) {
        sum += this.freq[i];
        n++;
      }
      return n ? sum / (n * 255) : 0;
    };

    const rawBass = Math.pow(avgRange(20, 140), 0.85);
    const rawMid = Math.pow(avgRange(140, 2000), 0.9);
    const rawHigh = Math.pow(avgRange(2000, 12000), 0.95);

    this.smooth.bass = damp(this.smooth.bass, rawBass, 0.45, 0.12);
    this.smooth.mid = damp(this.smooth.mid, rawMid, 0.35, 0.14);
    this.smooth.high = damp(this.smooth.high, rawHigh, 0.5, 0.18);

    const onset = rawBass - this.prevBass;
    this.prevBass = rawBass;
    const beatHit = onset > 0.12 ? Math.min(1, onset * 3) : 0;
    this.smooth.beat = Math.max(beatHit, this.smooth.beat * 0.82);

    return this.smooth;
  }

  private async ensureGraph() {
    if (this.ctx && this.el) return;
    this.ctx = new AudioContext();
    this.el = new Audio();
    this.el.crossOrigin = "anonymous";
    this.el.loop = true;
    this.el.preload = "auto";

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = this.lean ? 1024 : 2048;
    this.analyser.smoothingTimeConstant = 0.72;
    this.freq = new Uint8Array(this.analyser.frequencyBinCount);

    this.gain = this.ctx.createGain();
    this.gain.gain.value = this.muted ? 0 : 0.9;

    this.source = this.ctx.createMediaElementSource(this.el);
    this.source.connect(this.analyser);
    this.analyser.connect(this.gain);
    this.gain.connect(this.ctx.destination);

    await this.loadTrack(this.tracks[this.trackIndex].src, false);
  }

  private async loadTrack(src: string, autoplay: boolean) {
    if (!this.el) return;
    this.el.pause();
    this.el.src = src;
    this.el.load();
    await new Promise<void>((resolve, reject) => {
      if (!this.el) return reject();
      const ok = () => {
        cleanup();
        resolve();
      };
      const err = () => {
        cleanup();
        reject(new Error("track load failed"));
      };
      const cleanup = () => {
        this.el?.removeEventListener("canplaythrough", ok);
        this.el?.removeEventListener("error", err);
      };
      this.el.addEventListener("canplaythrough", ok, { once: true });
      this.el.addEventListener("error", err, { once: true });
    });
    if (autoplay) await this.play();
  }
}

function damp(current: number, target: number, attack: number, release: number) {
  const t = target > current ? attack : release;
  return current + (target - current) * t;
}

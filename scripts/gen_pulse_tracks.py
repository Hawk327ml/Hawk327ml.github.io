#!/usr/bin/env python3
"""Generate ship-ready PULSEFIELD loops (original, no third-party samples)."""

from __future__ import annotations

import math
import struct
import wave
from pathlib import Path

SR = 44100
ROOT = Path(__file__).resolve().parents[1] / "public" / "audio"


def clamp(x: float, lo: float = -1.0, hi: float = 1.0) -> float:
    return lo if x < lo else hi if x > hi else x


def env_exp(t: float, attack: float, release: float) -> float:
    if t < 0:
        return 0.0
    if t < attack:
        return t / max(1e-6, attack)
    return math.exp(-(t - attack) / max(1e-4, release))


def write_wav(path: Path, samples: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        frames = bytearray()
        for s in samples:
            v = int(clamp(s) * 32767)
            frames += struct.pack("<h", v)
        w.writeframes(frames)


def tone(freq: float, t: float) -> float:
    return math.sin(2 * math.pi * freq * t)


def noise(t: float) -> float:
    x = math.sin(t * 12497.13) * 43758.5453
    return (x - math.floor(x)) * 2.0 - 1.0


def render_track(
    *,
    bpm: float,
    bars: int,
    root_hz: float,
    arp: list[float],
    hat_gain: float,
    bass_gain: float,
    pad_gain: float,
) -> list[float]:
    beat = 60.0 / bpm
    duration = bars * 4 * beat
    n = int(duration * SR)
    out = [0.0] * n

    for i in range(n):
        t = i / SR
        beat_pos = (t / beat) % 4.0
        step = int(t / beat) % 16

        # Kick on 0 and 2 — bass energy for ring scale
        kick = 0.0
        if beat_pos < 0.18 or 2.0 <= beat_pos < 2.18:
            kt = beat_pos if beat_pos < 1.0 else beat_pos - 2.0
            kick = (
                env_exp(kt, 0.004, 0.22)
                * tone(root_hz * (1.0 + 3.2 * math.exp(-kt * 26)), t)
                * 0.95
            )

        # Snare / clap — mid
        snare = 0.0
        if 1.0 <= beat_pos < 1.16 or 3.0 <= beat_pos < 3.16:
            st = beat_pos - (1.0 if beat_pos < 2.0 else 3.0)
            snare = env_exp(st, 0.002, 0.12) * (0.55 * noise(t) + 0.25 * tone(180, t)) * 0.55

        # Hats — high
        hat = 0.0
        if step % 2 == 1 or step % 4 == 2:
            ht = (t % (beat * 0.5))
            hat = env_exp(ht, 0.001, 0.035) * noise(t * 1.7) * hat_gain

        # Sub bass
        bass = bass_gain * tone(root_hz, t) * (0.55 + 0.45 * math.sin(2 * math.pi * t / beat))
        if not (beat_pos < 0.55 or 2.0 <= beat_pos < 2.55):
            bass *= 0.4

        # Mid arp / lead
        note = arp[step % len(arp)]
        arp_t = t % beat
        lead = env_exp(arp_t, 0.01, 0.18) * (0.55 * tone(note, t) + 0.25 * tone(note * 2.005, t))

        # Soft pad
        pad = pad_gain * (
            0.4 * tone(root_hz * 2, t)
            + 0.3 * tone(root_hz * 3, t + 0.1)
            + 0.2 * tone(root_hz * 4.5, t)
        )
        pad *= 0.5 + 0.5 * math.sin(2 * math.pi * t / (beat * 8))

        out[i] = kick + snare + hat + bass + lead * 0.42 + pad

    peak = max(abs(x) for x in out) or 1.0
    gain = 0.92 / peak
    return [clamp(x * gain) for x in out]


def main() -> None:
    a = render_track(
        bpm=112,
        bars=8,
        root_hz=55.0,
        arp=[220, 247, 277, 330, 277, 247, 220, 196] * 2,
        hat_gain=0.22,
        bass_gain=0.38,
        pad_gain=0.12,
    )
    write_wav(ROOT / "pulse-a.wav", a)

    b = render_track(
        bpm=96,
        bars=7,
        root_hz=49.0,
        arp=[196, 220, 233, 262, 233, 220, 196, 175] * 2,
        hat_gain=0.18,
        bass_gain=0.42,
        pad_gain=0.16,
    )
    write_wav(ROOT / "pulse-b.wav", b)
    print("wrote", ROOT / "pulse-a.wav", ROOT / "pulse-b.wav")


if __name__ == "__main__":
    main()

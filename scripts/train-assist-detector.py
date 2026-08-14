"""
Train a tiny drone detector for Vision Assist Lab and export ONNX.

Synthetic orange/cyan blobs on dark arena → 160×160 input → 20×20×3 logits
(classes: background, drone-orange, drone-cyan).

Usage:
  python scripts/train-assist-detector.py
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "assist" / "models" / "drone-nano.onnx"
IMG = 160
GRID = 20
STRIDE = IMG // GRID  # 8
EPOCHS = 28
BATCH = 32
STEPS = 40


class NanoDet(nn.Module):
    def __init__(self) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(3, 16, 3, stride=2, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(16, 32, 3, stride=2, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 32, 3, stride=2, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 24, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(24, 3, 1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)


def paint_blob(
    img: np.ndarray,
    label: np.ndarray,
    cls: int,
    rng: np.random.Generator,
) -> None:
    r = float(rng.uniform(0.035, 0.07)) * IMG
    cx = float(rng.uniform(r + 4, IMG - r - 4))
    cy = float(rng.uniform(r + 4, IMG - r - 4))
    yy, xx = np.ogrid[:IMG, :IMG]
    mask = (xx - cx) ** 2 + (yy - cy) ** 2 <= r**2
    if cls == 1:  # orange
        color = np.array([0.91, 0.35, 0.12], dtype=np.float32)
        color = color * float(rng.uniform(0.85, 1.05))
    else:  # cyan
        color = np.array([0.17, 0.72, 0.77], dtype=np.float32)
        color = color * float(rng.uniform(0.85, 1.05))
    noise = rng.normal(0, 0.03, size=3).astype(np.float32)
    img[mask] = np.clip(color + noise, 0, 1)
    # soft label on grid
    gx = int(np.clip(cx / STRIDE, 0, GRID - 1))
    gy = int(np.clip(cy / STRIDE, 0, GRID - 1))
    rad = max(1, int(r / STRIDE) + 1)
    for dy in range(-rad, rad + 1):
        for dx in range(-rad, rad + 1):
            x = gx + dx
            y = gy + dy
            if 0 <= x < GRID and 0 <= y < GRID:
                dist = (dx * dx + dy * dy) ** 0.5
                if dist <= rad:
                    label[cls, y, x] = max(label[cls, y, x], 1.0 - dist / (rad + 1e-3))


def make_batch(n: int, rng: np.random.Generator) -> tuple[torch.Tensor, torch.Tensor]:
    imgs = np.zeros((n, IMG, IMG, 3), dtype=np.float32)
    labels = np.zeros((n, 3, GRID, GRID), dtype=np.float32)
    for i in range(n):
        base = float(rng.uniform(0.02, 0.06))
        imgs[i] = base + rng.normal(0, 0.008, size=(IMG, IMG, 3)).astype(np.float32)
        imgs[i] = np.clip(imgs[i], 0, 1)
        labels[i, 0] = 1.0
        for _ in range(int(rng.integers(1, 5))):
            cls = 1 if rng.random() > 0.45 else 2
            paint_blob(imgs[i], labels[i], cls, rng)
        obj = labels[i, 1:].max(axis=0)
        labels[i, 0] = np.clip(1.0 - obj, 0, 1)
    x = torch.from_numpy(imgs.transpose(0, 3, 1, 2).copy())
    y = torch.from_numpy(labels.copy())
    return x, y


def main() -> None:
    rng = np.random.default_rng(42)
    device = torch.device("cpu")
    model = NanoDet().to(device)
    opt = torch.optim.Adam(model.parameters(), lr=2e-3)

    model.train()
    for epoch in range(EPOCHS):
        total = 0.0
        for _ in range(STEPS):
            x, y = make_batch(BATCH, rng)
            x, y = x.to(device), y.to(device)
            logits = model(x)
            # upsample if needed
            if logits.shape[-2:] != (GRID, GRID):
                logits = F.interpolate(logits, size=(GRID, GRID), mode="bilinear", align_corners=False)
            loss = F.cross_entropy(logits, y.argmax(dim=1))
            opt.zero_grad()
            loss.backward()
            opt.step()
            total += float(loss.item())
        print(f"epoch {epoch + 1}/{EPOCHS} loss={total / STEPS:.4f}")

    model.eval()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    dummy = torch.zeros(1, 3, IMG, IMG, dtype=torch.float32)
    torch.onnx.export(
        model,
        dummy,
        str(OUT),
        input_names=["input"],
        output_names=["logits"],
        opset_version=17,
        dynamo=False,
    )
    size_kb = OUT.stat().st_size / 1024
    print(f"Wrote {OUT} ({size_kb:.1f} KB)")


if __name__ == "__main__":
    main()

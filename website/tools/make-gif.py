#!/usr/bin/env python3

# SPDX-FileCopyrightText: Copyright (c) 2025-2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0

"""Render the OpenShell architecture diagram to an animated GIF.

Frames are produced by headless Chrome from ``render-frame.html`` (one frame per
step of the auto-play tour in ``js/data.js``) and assembled with Pillow using a
single shared palette so colours stay stable across the loop.

Usage (from anywhere)::

    python website/tools/make-gif.py
    python website/tools/make-gif.py --width 1100 --colors 128 --out docs/arch.gif

Requires: Pillow, and Google Chrome or Microsoft Edge.
"""

from __future__ import annotations

import argparse
import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

from PIL import Image, ImageChops

TOOLS_DIR = pathlib.Path(__file__).resolve().parent
REPO_ROOT = TOOLS_DIR.parents[1]
FRAME_PAGE = TOOLS_DIR / "render-frame.html"
DATA_JS = TOOLS_DIR.parent / "js" / "data.js"

CANVAS_W, CANVAS_H = 1280, 870

# Per-channel difference below which a pixel is treated as unchanged between frames.
DELTA_THRESHOLD = 8

CHROME_CANDIDATES = [
    os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
    os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"),
    os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
    os.path.expandvars(r"%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"),
    os.path.expandvars(r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"),
    shutil.which("google-chrome"),
    shutil.which("chromium"),
    shutil.which("chromium-browser"),
]


def find_browser() -> str:
    for candidate in CHROME_CANDIDATES:
        if candidate and pathlib.Path(candidate).exists():
            return str(candidate)
    sys.exit("error: could not find Chrome or Edge; pass --browser <path>")


def read_tour() -> list[str]:
    """Extract the ordered node ids from the `tour` array in js/data.js."""
    source = DATA_JS.read_text(encoding="utf-8")
    match = re.search(r"var\s+tour\s*=\s*\[(.*?)\];", source, re.S)
    if not match:
        sys.exit(f"error: could not find the `tour` array in {DATA_JS}")
    return re.findall(r'"([^"]+)"', match.group(1))


def capture(browser: str, node: str | None, out_png: pathlib.Path, profile: pathlib.Path, scale: int) -> None:
    query = f"?node={node}" if node else ""
    url = FRAME_PAGE.resolve().as_uri() + query
    cmd = [
        browser,
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-extensions",
        f"--user-data-dir={profile}",
        f"--force-device-scale-factor={scale}",
        f"--window-size={CANVAS_W},{CANVAS_H}",
        "--virtual-time-budget=1500",
        f"--screenshot={out_png.resolve()}",
        url,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if not out_png.exists():
        sys.exit(f"error: no screenshot produced for {node or 'neutral'}\n{result.stderr[-2000:]}")


def build_gif(
    frames: list[pathlib.Path],
    out: pathlib.Path,
    width: int,
    durations: list[int],
    colors: int,
    delta: bool = True,
) -> tuple[int, int]:
    """Write the GIF and return the output (width, height).

    Only a small region of the diagram changes between steps, so delta encoding
    (leave the previous frame in place, repaint only changed pixels as opaque and
    the rest as transparent) shrinks the file roughly sixfold — 1.5 MB to ~250 KB
    at full resolution — with no visible difference.
    """
    size = (width, round(width * CANVAS_H / CANVAS_W))
    sources = [Image.open(f).convert("RGB").resize(size, Image.LANCZOS) for f in frames]

    # One palette slot is reserved as the transparent index for delta frames.
    palette = sources[0].quantize(
        colors=colors - 1 if delta else colors, method=Image.MEDIANCUT
    )
    opaque_index = colors - 1
    if delta:
        palette.putpalette((palette.getpalette() + [0, 0, 0] * 256)[:768])

    quantized = []
    previous: Image.Image | None = None
    for rgb in sources:
        frame = rgb.quantize(palette=palette, dither=Image.Dither.NONE)
        if delta and previous is not None:
            changed = (
                ImageChops.difference(rgb, previous)
                .convert("L")
                .point(lambda value: 255 if value > DELTA_THRESHOLD else 0)
            )
            frame.paste(opaque_index, mask=ImageChops.invert(changed))
            frame.info["transparency"] = opaque_index
        previous = rgb
        quantized.append(frame)

    out.parent.mkdir(parents=True, exist_ok=True)
    quantized[0].save(
        out,
        format="GIF",
        save_all=True,
        append_images=quantized[1:],
        duration=durations,
        loop=0,
        optimize=True,
        disposal=1 if delta else 2,
    )
    return size


def verify(out: pathlib.Path, frames: list[pathlib.Path], size: tuple[int, int]) -> int:
    """Re-read the GIF and confirm every frame composites back to what we encoded.

    Returns the worst single-channel difference. Quantisation is lossy so a small
    residual is expected; a large value means the delta frames are not compositing.
    """
    expected = [Image.open(f).convert("RGB").resize(size, Image.LANCZOS) for f in frames]
    decoded = Image.open(out)
    if decoded.n_frames != len(expected):
        sys.exit(f"error: expected {len(expected)} frames, GIF has {decoded.n_frames}")

    worst = 0
    for index, source in enumerate(expected):
        decoded.seek(index)
        difference = ImageChops.difference(decoded.convert("RGB"), source).convert("L")
        worst = max(worst, difference.getextrema()[1])
    return worst


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--out",
        default=str(REPO_ROOT / "docs" / "images" / "openshell-system-architecture.gif"),
        help="output GIF path",
    )
    parser.add_argument("--width", type=int, default=1280, help="output GIF width in px")
    parser.add_argument("--colors", type=int, default=256, help="palette size (2-256)")
    parser.add_argument("--step-ms", type=int, default=1100, help="hold time per tour step")
    parser.add_argument("--neutral-ms", type=int, default=700, help="hold time on the unhiglighted frame")
    parser.add_argument("--scale", type=int, default=2, help="device scale factor for capture")
    parser.add_argument("--browser", default=None)
    parser.add_argument("--keep-frames", action="store_true", help="leave the PNG frames on disk")
    parser.add_argument("--no-delta", action="store_true", help="write full frames instead of delta frames")
    args = parser.parse_args()

    browser = args.browser or find_browser()
    tour = read_tour()
    print(f"browser : {browser}")
    print(f"tour    : {len(tour)} steps -> {', '.join(tour)}")

    out = pathlib.Path(args.out).resolve()
    workdir = pathlib.Path(tempfile.mkdtemp(prefix="openshell-gif-"))
    frames_dir = workdir / "frames"
    frames_dir.mkdir()
    profile = workdir / "profile"

    frames: list[pathlib.Path] = []
    try:
        # Frame 0 is the neutral diagram; the rest highlight each tour step.
        plan: list[str | None] = [None, *tour]
        for index, node in enumerate(plan):
            png = frames_dir / f"frame_{index:02d}.png"
            capture(browser, node, png, profile, args.scale)
            frames.append(png)
            print(f"  captured {png.name}  ({node or 'neutral'})")

        durations = [args.neutral_ms] + [args.step_ms] * len(tour)
        size = build_gif(frames, out, args.width, durations, args.colors, delta=not args.no_delta)
        residual = verify(out, frames, size)
    finally:
        if args.keep_frames:
            print(f"frames  : {frames_dir}")
        else:
            shutil.rmtree(workdir, ignore_errors=True)

    size_kb = out.stat().st_size / 1024
    frame_count = 1 + len(tour)
    loop_seconds = (args.neutral_ms + len(tour) * args.step_ms) / 1000
    print(f"\nwrote {out}")
    print(f"  {frame_count} frames, {size}x{round(args.width * CANVAS_H / CANVAS_W)}, {size_kb:.0f} KB")
    print(f"  loop length {loop_seconds:.1f}s")
    print(f"  verified: worst channel difference vs source {residual}/255")


if __name__ == "__main__":
    main()

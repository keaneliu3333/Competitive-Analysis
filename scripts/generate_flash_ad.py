from __future__ import annotations

import math
import os
import random
import struct
import wave
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
FRAMES_DIR = ROOT / "dist" / "flash_ad_frames"
AUDIO_PATH = ROOT / "dist" / "original_minimal_pop.wav"
W, H = 1080, 1920
FPS = 30
DURATION = 15
TOTAL_FRAMES = FPS * DURATION


def ease_out_cubic(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3


def ease_in_out(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def font(size: int, weight: str = "regular") -> ImageFont.FreeTypeFont:
    candidates = [
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial Unicode.ttf",
    ]
    for candidate in candidates:
        if os.path.exists(candidate):
            return ImageFont.truetype(candidate, size=size)
    return ImageFont.load_default()


FONT_TITLE = font(118)
FONT_TITLE_BIG = font(154)
FONT_SMALL = font(38)
FONT_MICRO = font(26)


def text_size(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.ImageFont) -> tuple[int, int]:
    box = draw.textbbox((0, 0), text, font=fnt)
    return box[2] - box[0], box[3] - box[1]


def add_text(
    img: Image.Image,
    text: str,
    y: int,
    fnt: ImageFont.ImageFont,
    fill: tuple[int, int, int, int],
    tracking: int = 0,
    x_offset: int = 0,
) -> None:
    draw = ImageDraw.Draw(img)
    if tracking == 0:
        tw, _ = text_size(draw, text, fnt)
        draw.text(((W - tw) / 2 + x_offset, y), text, font=fnt, fill=fill)
        return
    widths = [text_size(draw, ch, fnt)[0] for ch in text]
    total = sum(widths) + tracking * (len(text) - 1)
    x = (W - total) / 2 + x_offset
    for ch, cw in zip(text, widths):
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += cw + tracking


def draw_earbud(
    base: Image.Image,
    cx: float,
    cy: float,
    scale: float,
    angle: float,
    alpha: int,
    side: int = 1,
) -> None:
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    white = (248, 248, 248, alpha)
    grey = (210, 214, 218, int(alpha * 0.65))
    shadow = (0, 0, 0, int(alpha * 0.18))
    stem_w = 58 * scale
    stem_h = 420 * scale
    head_r = 112 * scale
    sx = cx + side * 84 * scale
    sy = cy + 30 * scale
    d.rounded_rectangle(
        [sx - stem_w / 2, sy, sx + stem_w / 2, sy + stem_h],
        radius=int(stem_w / 2),
        fill=shadow,
    )
    d.rounded_rectangle(
        [sx - stem_w / 2 - 9 * scale, sy - 10 * scale, sx + stem_w / 2 - 9 * scale, sy + stem_h - 10 * scale],
        radius=int(stem_w / 2),
        fill=white,
    )
    d.ellipse(
        [cx - head_r, cy - head_r, cx + head_r, cy + head_r],
        fill=shadow,
    )
    d.ellipse(
        [cx - head_r - 12 * scale, cy - head_r - 12 * scale, cx + head_r - 12 * scale, cy + head_r - 12 * scale],
        fill=white,
    )
    d.ellipse(
        [cx - side * 78 * scale - 38 * scale, cy - 34 * scale, cx - side * 78 * scale + 38 * scale, cy + 34 * scale],
        fill=(42, 45, 48, int(alpha * 0.78)),
    )
    d.arc(
        [cx - 82 * scale, cy - 72 * scale, cx + 84 * scale, cy + 76 * scale],
        start=214 if side > 0 else 324,
        end=320 if side > 0 else 146,
        fill=grey,
        width=max(2, int(8 * scale)),
    )
    rotated = layer.rotate(angle, center=(cx, cy), resample=Image.Resampling.BICUBIC)
    base.alpha_composite(rotated)


def draw_rings(base: Image.Image, frame: int, beat: float, inverted: bool) -> None:
    d = ImageDraw.Draw(base, "RGBA")
    center = (W / 2, H / 2 - 20)
    for i in range(5):
        local = (frame / FPS * 1.8 + i * 0.18) % 1
        r = lerp(160, 880, local)
        a = int((1 - local) * 72 * (0.4 + beat * 0.6))
        col = (255, 255, 255, a) if inverted else (0, 0, 0, a)
        d.ellipse([center[0] - r, center[1] - r, center[0] + r, center[1] + r], outline=col, width=3)


def make_frame(i: int) -> Image.Image:
    t = i / FPS
    beat_phase = (t * 125 / 60) % 1
    beat = 1 - ease_out_cubic(beat_phase)
    snap = 1 if beat_phase < 0.08 else 0
    inverted = 4.2 <= t < 5.25 or 9.0 <= t < 10.05 or 12.35 <= t < 13.1
    bg = (246, 246, 243, 255) if not inverted else (8, 8, 10, 255)
    img = Image.new("RGBA", (W, H), bg)
    d = ImageDraw.Draw(img, "RGBA")

    if not inverted:
        for y in range(H):
            shade = int(246 - 24 * y / H)
            d.line([(0, y), (W, y)], fill=(shade, shade, max(238, shade), 255))
    else:
        d.rectangle([0, 0, W, H], fill=(8, 8, 10, 255))

    draw_rings(img, i, beat, inverted)

    # Beat-synced quick flashes and product silhouettes.
    scene = int(t // 1.25)
    palette = [
        (0, 0, 0, 255),
        (245, 245, 245, 255),
        (35, 58, 255, 255),
        (255, 72, 48, 255),
        (0, 176, 128, 255),
    ]
    accent = palette[(scene + snap) % len(palette)]
    if snap:
        d.rectangle([0, 0, W, H], fill=accent)

    product_alpha = int(lerp(135, 255, beat))
    scale = 1.08 + 0.12 * beat
    drift = math.sin(t * 2.3) * 30
    if t < 3.0:
        draw_earbud(img, W / 2 - 70 + drift, 820, scale * ease_out_cubic(t / 1.2), -18 + 8 * beat, product_alpha, side=1)
        draw_earbud(img, W / 2 + 70 - drift, 820, scale * ease_out_cubic(t / 1.2), 18 - 8 * beat, product_alpha, side=-1)
    elif t < 7.5:
        for n in range(7):
            angle = n * 51 + t * 52
            rad = 250 + 90 * math.sin(t * 1.7 + n)
            cx = W / 2 + math.cos(math.radians(angle)) * rad
            cy = 900 + math.sin(math.radians(angle)) * rad
            draw_earbud(img, cx, cy, 0.42 + 0.04 * beat, angle + 90, 190, side=1 if n % 2 else -1)
    elif t < 11.8:
        split = ease_in_out((t - 7.5) / 4.3)
        d.rectangle([0, 0, W * split, H], fill=(4, 4, 5, 255))
        d.rectangle([W * split, 0, W, H], fill=(246, 246, 243, 255))
        draw_earbud(img, W / 2 - 130 - 60 * beat, 805, 1.15, -10, 245, side=1)
        draw_earbud(img, W / 2 + 130 + 60 * beat, 805, 1.15, 10, 245, side=-1)
    else:
        halo = int(420 + beat * 90)
        for r in range(halo, 40, -28):
            a = int(18 * r / halo)
            d.ellipse([W / 2 - r, 820 - r, W / 2 + r, 820 + r], fill=(255, 255, 255, a))
        draw_earbud(img, W / 2 - 100, 760, 1.0 + 0.08 * beat, -12, 255, side=1)
        draw_earbud(img, W / 2 + 100, 760, 1.0 + 0.08 * beat, 12, 255, side=-1)

    # Kinetic copy.
    copy_color = (248, 248, 248, 255) if inverted or snap else (10, 10, 12, 255)
    secondary = (248, 248, 248, 180) if inverted or snap else (10, 10, 12, 170)
    if 1.1 <= t < 3.3:
        p = ease_out_cubic((t - 1.1) / 0.35)
        add_text(img, "做一个", int(250 - 40 * (1 - p)), FONT_TITLE, copy_color, tracking=8)
    if 3.2 <= t < 6.1:
        p = ease_out_cubic((t - 3.2) / 0.3)
        add_text(img, "没有做过的", int(1180 + 55 * (1 - p)), FONT_TITLE_BIG, copy_color, tracking=4)
    if 6.0 <= t < 9.2:
        p = ease_out_cubic((t - 6.0) / 0.3)
        add_text(img, "风格", int(280 - 70 * (1 - p)), FONT_TITLE_BIG, copy_color, tracking=18)
    if 10.0 <= t < 12.6:
        add_text(img, "NO TEMPLATE", 320, FONT_SMALL, secondary, tracking=7)
        add_text(img, "NEW MOTION", 1420, FONT_SMALL, secondary, tracking=7)
    if t >= 12.7:
        fade = clamp((t - 12.7) / 0.7, 0, 1) * clamp((15 - t) / 1.2, 0, 1)
        add_text(img, "做一个没有做过的风格", 1220, FONT_SMALL, (12, 12, 14, int(255 * fade)), tracking=1)
        add_text(img, "original flash film  /  15s", 1295, FONT_MICRO, (12, 12, 14, int(145 * fade)), tracking=3)

    # Micro grain gives clean renders less banding.
    random.seed(i)
    grain = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grain)
    for _ in range(520):
        x = random.randrange(W)
        y = random.randrange(H)
        a = random.randrange(6, 16)
        gd.point((x, y), fill=(255, 255, 255, a) if inverted else (0, 0, 0, a))
    img.alpha_composite(grain)
    return img.convert("RGB")


def synth_audio() -> None:
    sr = 44100
    total = sr * DURATION
    bpm = 125
    beat_len = 60 / bpm
    samples: list[float] = []
    notes = [55, 73.42, 82.41, 98, 110, 146.83, 164.81, 196]
    for n in range(total):
        t = n / sr
        beat_pos = (t / beat_len) % 1
        bar_pos = (t / (beat_len * 4)) % 1
        step = int(t / (beat_len / 2))
        bass_freq = notes[(step // 2) % len(notes)]
        kick = math.sin(2 * math.pi * (68 - 38 * min(beat_pos * 7, 1)) * t) * math.exp(-beat_pos * 15)
        hat_phase = (t / (beat_len / 2)) % 1
        hat = (random.random() * 2 - 1) * math.exp(-hat_phase * 22) * 0.09
        pluck_env = math.exp(-hat_phase * 8)
        pluck_freq = notes[(step + 3) % len(notes)] * 4
        pluck = math.sin(2 * math.pi * pluck_freq * t) * pluck_env * 0.12
        bass = math.sin(2 * math.pi * bass_freq * t) * (0.24 if beat_pos < 0.55 else 0.07)
        pad = math.sin(2 * math.pi * 220 * t) * 0.025 + math.sin(2 * math.pi * 277.18 * t) * 0.018
        drop_gate = 0.45 + 0.55 * (1 if 4.0 < t < 13.2 else ease_in_out(min(t / 4, 1)))
        riser = math.sin(2 * math.pi * (520 + 110 * math.sin(t * 0.6)) * t) * (bar_pos ** 3) * 0.035
        sample = (kick * 0.58 + hat + pluck + bass + pad + riser) * drop_gate
        if 14.2 < t:
            sample *= max(0, (15 - t) / 0.8)
        samples.append(clamp(sample, -0.95, 0.95))
    AUDIO_PATH.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(AUDIO_PATH), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sr)
        for sample in samples:
            wav.writeframes(struct.pack("<h", int(sample * 32767)))


def main() -> None:
    FRAMES_DIR.mkdir(parents=True, exist_ok=True)
    for old in FRAMES_DIR.glob("frame_*.png"):
        old.unlink()
    synth_audio()
    for i in range(TOTAL_FRAMES):
        make_frame(i).save(FRAMES_DIR / f"frame_{i:04d}.png", optimize=False)
        if i % 30 == 0:
            print(f"rendered {i}/{TOTAL_FRAMES}")
    print(f"frames: {FRAMES_DIR}")
    print(f"audio: {AUDIO_PATH}")


if __name__ == "__main__":
    main()

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / ".venv-packages"))

import imageio_ffmpeg


ROOT = Path(__file__).resolve().parents[1]
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
FRAMES = ROOT / "dist" / "flash_ad_frames" / "frame_%04d.png"
AUDIO = ROOT / "dist" / "original_minimal_pop.wav"
OUTPUT = ROOT / "dist" / "apple_style_flash_ad_15s.mp4"


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    if OUTPUT.exists():
        OUTPUT.unlink()
    cmd = [
        FFMPEG,
        "-y",
        "-framerate",
        "30",
        "-i",
        str(FRAMES),
        "-i",
        str(AUDIO),
        "-t",
        "15",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-movflags",
        "+faststart",
        str(OUTPUT),
    ]
    subprocess.run(cmd, check=True)
    print(OUTPUT)


if __name__ == "__main__":
    main()

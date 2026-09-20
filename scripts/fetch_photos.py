#!/usr/bin/env python3
"""Pull a small Unsplash photo pool for prototype display.

Usage:
  python3 scripts/fetch_photos.py <prototype-root>
  python3 scripts/fetch_photos.py prototypes/park-initiation

Writes at most 10 JPEGs into <root>/kits/ob-static/photos/.
Images are resized and recompressed. They are for showing a picture,
not for matching a real scene. Re-running replaces the pool.
"""

from __future__ import annotations

import json
import random
import shutil
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

MAX_PHOTOS = 10
FETCH_COUNT = 8
MAX_EDGE = 960
JPEG_QUALITY = 55
UA = "Mozilla/5.0 (compatible; pm-proto-photos/1.0)"


def die(msg: str, code: int = 1) -> None:
    print(f"error: {msg}", file=sys.stderr)
    sys.exit(code)


def fetch_json(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def unsplash_urls() -> list[str]:
    data = fetch_json(
        "https://unsplash.com/napi/photos/random?count=%d&orientation=landscape" % FETCH_COUNT
    )
    if isinstance(data, dict):
        data = [data]
    urls = []
    for item in data:
        raw = ((item.get("urls") or {}).get("regular") or (item.get("urls") or {}).get("small") or "")
        if not raw:
            continue
        sep = "&" if "?" in raw else "?"
        urls.append(raw + sep + "w=%d&q=60&fm=jpg" % MAX_EDGE)
    return urls


# Public images.unsplash.com ids. Used when the random API returns 401.
DIRECT_IDS = [
    "1469474968028-56623f02e42e",
    "1441974231531-c6227db76b6e",
    "1500530855697-b586d89ba3ee",
    "1480714378408-67cf0d13bc1b",
    "1497366216548-37526070297c",
    "1497366754035-f200968a6e72",
    "1560518883-ce09059eeffa",
    "1486406146926-c627a92ad1ab",
    "1503387762-592deb58ef4e",
    "1477959858617-67f85cf4f1df",
    "1449824913935-59a10b8d2000",
    "1460317442991-0ec209397118",
    "1486325212027-8081e485255e",
    "1493809842364-78817add7ffb",
    "1511818966892-d7d671e672a2",
    "1545324418-cc1a3fa10c00",
    "1554469384-e58fac16e23a",
    "1570129477492-45c003edd2be",
    "1564013799919-ab600027ffc6",
    "1582407947304-fd86f028f716",
]


def direct_unsplash_urls() -> list[str]:
    ids = random.sample(DIRECT_IDS, min(FETCH_COUNT, len(DIRECT_IDS)))
    return [
        "https://images.unsplash.com/photo-%s?auto=format&fit=crop&w=%d&q=60&fm=jpg" % (pid, MAX_EDGE)
        for pid in ids
    ]


def picsum_urls() -> list[str]:
    page = 3
    data = fetch_json("https://picsum.photos/v2/list?page=%d&limit=%d" % (page, FETCH_COUNT))
    urls = []
    for item in data:
        download = item.get("download_url") or ""
        if not download:
            continue
        urls.append(download.rsplit("/", 2)[0] + "/%d/%d" % (MAX_EDGE, int(MAX_EDGE * 0.7)))
    return urls


def download(url: str, dest: Path) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=40) as resp:
        dest.write_bytes(resp.read())


def compress_sips(src: Path, dest: Path) -> None:
    subprocess.check_call(
        [
            "sips",
            "-s",
            "format",
            "jpeg",
            "-s",
            "formatOptions",
            str(JPEG_QUALITY),
            "-Z",
            str(MAX_EDGE),
            str(src),
            "--out",
            str(dest),
        ],
        stdout=subprocess.DEVNULL,
    )


def compress_pillow(src: Path, dest: Path) -> None:
    from PIL import Image

    img = Image.open(src).convert("RGB")
    img.thumbnail((MAX_EDGE, MAX_EDGE))
    img.save(dest, "JPEG", quality=JPEG_QUALITY, optimize=True)


def compress(src: Path, dest: Path) -> None:
    if shutil.which("sips"):
        compress_sips(src, dest)
        return
    try:
        compress_pillow(src, dest)
    except Exception as err:
        die("need macOS sips or Pillow to compress: %s" % err)


def main() -> None:
    if len(sys.argv) != 2:
        die("usage: python3 scripts/fetch_photos.py <prototype-root>")
    root = Path(sys.argv[1]).expanduser().resolve()
    if not (root / "kits" / "ob-static").is_dir():
        die("not a prototype package (missing kits/ob-static): %s" % root)
    dest = root / "kits" / "ob-static" / "photos"
    dest.mkdir(parents=True, exist_ok=True)

    urls = []
    try:
        urls = unsplash_urls()
    except Exception as err:
        print("unsplash random failed (%s), fallback to images.unsplash.com" % err, file=sys.stderr)
    if not urls:
        try:
            urls = direct_unsplash_urls()
        except Exception as err:
            print("direct unsplash failed (%s), fallback to picsum" % err, file=sys.stderr)
    if not urls:
        urls = picsum_urls()
    urls = [u for u in urls if u][:MAX_PHOTOS]
    if not urls:
        die("no image urls")

    written = []
    with tempfile.TemporaryDirectory() as tmp:
        tmp_dir = Path(tmp)
        for i, url in enumerate(urls, start=1):
            raw = tmp_dir / ("raw-%02d" % i)
            out = dest / ("%02d.jpg" % i)
            try:
                download(url, raw)
                compress(raw, out)
            except Exception as err:
                print("skip %s (%s)" % (url, err), file=sys.stderr)
                continue
            written.append(out.name)
            print("%s  %dKB" % (out.name, out.stat().st_size // 1024))

    if not written:
        die("downloaded nothing")

    for old in dest.iterdir():
        if old.name not in written and old.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"}:
            old.unlink()
    kept = sorted(p.name for p in dest.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"})
    if len(kept) > MAX_PHOTOS:
        die("photo pool has %d files, max is %d" % (len(kept), MAX_PHOTOS))
    print("photos: %d in %s" % (len(kept), dest))


if __name__ == "__main__":
    main()

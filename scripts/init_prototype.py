#!/usr/bin/env python3
"""Initialize a self-contained prototype package and vendor kits into it.

Usage:
  python3 scripts/init_prototype.py <destination> --name <slug>
  python3 scripts/init_prototype.py prototypes/my-app

Existing files are preserved; only missing files are added. Kits are copied from the skill repo
root kits/ into <dest>/kits/ — no CSS build step.
"""

from __future__ import annotations

import argparse
import shutil
from html import escape
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KITS_SRC = ROOT / "kits"
SITEMAP_TMPL = ROOT / "skills" / "proto-spec-generator" / "templates" / "sitemap.yaml"


def die(msg: str, code: int = 1) -> None:
    print(f"error: {msg}", file=sys.stderr)
    sys.exit(code)


def copy_kits(dest: Path) -> None:
    if not KITS_SRC.is_dir():
        die(f"kits source not found: {KITS_SRC}")
    names = ("ob-static", "proto-spec-runtime", "proto-mock")
    for name in names:
        if not (KITS_SRC / name).is_dir():
            die(f"missing kit: {KITS_SRC / name}")
    for name in names:
        src = KITS_SRC / name
        for source in src.rglob("*"):
            if not source.is_file() or source.name == ".DS_Store":
                continue
            target = dest / "kits" / name / source.relative_to(src)
            if not target.exists():
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source, target)


def write_text(path: Path, content: str) -> None:
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def scaffold(dest: Path, slug: str) -> None:
    slug = escape(slug)
    today = date.today().isoformat()
    write_text(
        dest / "changelog.yaml",
        f"""version: 1
updatedAt: {today}

labels: {{}}

package:
  - date: {today}
    summary: 初始化原型包并 vendoring kits
    items:
      - 复制 kits/ob-static、kits/proto-spec-runtime、kits/proto-mock 到包内
      - 创建 sitemap / proto-spec / docs 骨架

pages: {{}}
""",
    )

    if SITEMAP_TMPL.is_file():
        write_text(dest / "sitemap.yaml", SITEMAP_TMPL.read_text(encoding="utf-8"))
    else:
        write_text(
            dest / "sitemap.yaml",
            f"""docVersion: "0.1.0"
updatedAt: {today}
scenario: multi-user
status: draft

groups: []
pages: []
""",
        )

    write_text(
        dest / "index.html",
        f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{slug} — PRD 汇总</title>
  <link rel="stylesheet" href="kits/ob-static/tokens.css" />
  <link rel="stylesheet" href="kits/ob-static/components.css" />
  <link rel="stylesheet" href="kits/ob-static/prototype.css" />
  <link rel="stylesheet" href="kits/proto-spec-runtime/proto-spec.css" />
</head>
<body>
  <div class="proto-doc proto-doc--fluid">
    <div class="proto-doc__nav">
      <span>页面说明由 Runtime 按 sitemap 聚合</span>
    </div>
    <article>
      <div class="prd-hub__title-row">
        <h1>PRD 汇总</h1>
        <div id="prdTocMenu"></div>
        <div id="prdGlobalSearch"></div>
      </div>
      <div id="prdHub"></div>
    </article>
  </div>
  <script src="kits/proto-spec-runtime/proto-spec.js"></script>
  <script>
    ProtoSpecRuntime.mountPrdHub({{
      root: '#prdHub',
      tocMenuRoot: '#prdTocMenu',
      globalSearchRoot: '#prdGlobalSearch',
      sitemapUrl: './sitemap.yaml',
      specBase: './proto-spec/',
      packageBase: './',
      packagePrdUrl: './docs/prd.md',
    }});
  </script>
</body>
</html>
""",
    )

    write_text(
        dest / "docs" / "prd.html",
        """<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="0; url=../index.html" />
  <title>转到 PRD 汇总</title>
  <script>location.replace('../index.html' + location.hash);</script>
</head>
<body>
  <p><a href="../index.html">PRD 汇总在包根 index.html</a></p>
</body>
</html>
""",
    )

    (dest / "proto-spec").mkdir(parents=True, exist_ok=True)
    (dest / "pages").mkdir(parents=True, exist_ok=True)
    write_text(dest / "proto-spec" / ".gitkeep", "")
    write_text(dest / "pages" / ".gitkeep", "")


def main() -> None:
    parser = argparse.ArgumentParser(description="Init self-contained prototype package")
    parser.add_argument("destination", type=Path, help="Package directory (existing files preserved)")
    parser.add_argument("--name", help="Display / slug name (default: destination folder name)")
    args = parser.parse_args()

    dest = args.destination.expanduser().resolve()
    slug = args.name or dest.name

    if dest == ROOT or dest == KITS_SRC or KITS_SRC in dest.parents:
        die("destination must not be the skill root or source kits")
    if dest.exists() and not dest.is_dir():
        die(f"destination is not a directory: {dest}")
    if dest.exists() and any(p.is_symlink() for p in dest.rglob("*")):
        die("destination contains symlinks; use a package with local resources")
    dest.mkdir(parents=True, exist_ok=True)

    copy_kits(dest)
    scaffold(dest, slug)
    print(f"initialized: {dest}")
    print(f"  kits vendored: {dest / 'kits'}")
    print("  open with a static server, e.g. npx serve <dest>")


if __name__ == "__main__":
    main()

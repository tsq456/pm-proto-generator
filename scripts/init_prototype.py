#!/usr/bin/env python3
"""Initialize a self-contained prototype package and vendor kits into it.

Usage:
  python3 scripts/init_prototype.py <destination> --name <slug>
  python3 scripts/init_prototype.py prototypes/my-app

Destination must be empty or not exist. Kits are copied from the skill repo
root kits/ into <dest>/kits/ — no CSS build step.
"""

from __future__ import annotations

import argparse
import shutil
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
    for name in ("ob-static", "proto-spec-runtime", "proto-mock"):
        src = KITS_SRC / name
        if not src.is_dir():
            die(f"missing kit: {src}")
        target = dest / "kits" / name
        if target.exists():
            shutil.rmtree(target)
        shutil.copytree(src, target, ignore=shutil.ignore_patterns(".DS_Store"))


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def scaffold(dest: Path, slug: str) -> None:
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
        shutil.copy2(SITEMAP_TMPL, dest / "sitemap.yaml")
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
      <span>包已初始化；sitemap 确认后由 Runtime 聚合 Spec</span>
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

    write_text(dest / "docs" / "menu-plan.md", "# 菜单栏目规划表\n\n（Phase 3 填写；先完成 req-breakdown）\n")
    write_text(
        dest / "docs" / "req-breakdown.md",
        "# 需求拆清\n\n"
        "（Phase 2.5：问题/方案 → 角色×场景 → 首批 P0 页；确认后再写菜单规划表）\n",
    )
    write_text(dest / "docs" / "prd.md", f"# {slug} PRD 骨架\n\n（Phase 2 填写）\n")
    (dest / "proto-spec").mkdir(parents=True, exist_ok=True)
    (dest / "pages").mkdir(parents=True, exist_ok=True)
    write_text(dest / "proto-spec" / ".gitkeep", "")
    write_text(dest / "pages" / ".gitkeep", "")


def main() -> None:
    parser = argparse.ArgumentParser(description="Init self-contained prototype package")
    parser.add_argument("destination", type=Path, help="Package directory (empty or new)")
    parser.add_argument("--name", help="Display / slug name (default: destination folder name)")
    args = parser.parse_args()

    dest = args.destination.expanduser().resolve()
    slug = args.name or dest.name

    if dest.exists():
        if any(dest.iterdir()):
            die(f"destination not empty: {dest}")
    else:
        dest.mkdir(parents=True)

    copy_kits(dest)
    scaffold(dest, slug)
    print(f"initialized: {dest}")
    print(f"  kits vendored: {dest / 'kits'}")
    print("  open with a static server, e.g. npx serve <dest>")


if __name__ == "__main__":
    main()

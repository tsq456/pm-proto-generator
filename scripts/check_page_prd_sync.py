#!/usr/bin/env python3
"""Check bidirectional sync between pages HTML, sitemap.yaml, and proto-spec/*.md.

Usage:
  python3 check_page_prd_sync.py <prototype-package-root> [--fix]

Exit code 1 if --fix and any hard mismatch is found.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


PAGE_ID_RE = re.compile(r"^\s*-\s*id:\s*([A-Za-z0-9_-]+)\s*$")
PATH_RE = re.compile(r"^\s*path:\s*(.+?)\s*$")
STATUS_RE = re.compile(r"^\s*status:\s*([A-Za-z0-9_-]+)\s*$")
GROUP_ID_RE = re.compile(r"^\s*-\s*id:\s*((?:prod|mod|role)-[A-Za-z0-9_-]+)\s*$")
GROUP_REF_RE = re.compile(r"^\s*groupId:\s*([A-Za-z0-9_-]+)\s*$")


def parse_sitemap(text: str):
    pages = []  # {id, path, status}
    groups = set()
    group_refs = set()
    current = None
    in_pages = False
    in_groups = False
    for line in text.splitlines():
        if line.startswith("pages:"):
            in_pages = True
            in_groups = False
            current = None
            continue
        if line.startswith("groups:"):
            in_groups = True
            in_pages = False
            current = None
            continue
        if in_groups:
            m = GROUP_ID_RE.match(line)
            if m:
                groups.add(m.group(1))
            continue
        if not in_pages:
            continue
        m = PAGE_ID_RE.match(line)
        if m and not line.strip().startswith("- id: mod-") and line.lstrip().startswith("- id:"):
            # pages section: any - id:
            if current:
                pages.append(current)
            current = {"id": m.group(1), "path": None, "status": None}
            continue
        if current is None:
            continue
        pm = PATH_RE.match(line)
        if pm:
            current["path"] = pm.group(1).strip().strip("\"'")
            continue
        sm = STATUS_RE.match(line)
        if sm:
            current["status"] = sm.group(1)
            continue
        gm = GROUP_REF_RE.match(line)
        if gm:
            group_refs.add(gm.group(1))
    if current:
        pages.append(current)
    return pages, groups, group_refs


def collect_page_ids(pages):
    return {p["id"] for p in pages}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("root", type=Path, help="prototype package root")
    ap.add_argument("--fix", action="store_true")
    args = ap.parse_args()
    root = args.root.resolve()
    sitemap = root / "sitemap.yaml"
    pages_dir = root / "pages"
    spec_dir = root / "proto-spec"

    errors = []
    warnings = []

    if not sitemap.is_file():
        errors.append(f"missing sitemap.yaml under {root}")
        print_report(errors, warnings)
        return 1 if args.fix else 0

    text = sitemap.read_text(encoding="utf-8")
    pages, groups, group_refs = parse_sitemap(text)
    sitemap_ids = collect_page_ids(pages)

    html_ids = set()
    if pages_dir.is_dir():
        for p in pages_dir.glob("*.html"):
            html_ids.add(p.stem)

    spec_ids = set()
    if spec_dir.is_dir():
        for p in spec_dir.glob("*.md"):
            spec_ids.add(p.stem)

    # HTML gone but still in sitemap (draft+)
    for p in pages:
        pid = p["id"]
        status = (p.get("status") or "").lower()
        if status in ("deprecated", "planned"):
            continue
        path = p.get("path") or f"pages/{pid}.html"
        html_path = root / path
        if not html_path.is_file() and pid not in html_ids:
            errors.append(
                f"sitemap page `{pid}` has no HTML ({path}); remove sitemap entry + proto-spec/{pid}.md"
            )

    # Spec without sitemap
    for sid in sorted(spec_ids - sitemap_ids):
        errors.append(
            f"orphan proto-spec `{sid}.md` (no sitemap page); delete Spec or restore sitemap entry"
        )

    # Sitemap draft without Spec
    for p in pages:
        pid = p["id"]
        status = (p.get("status") or "").lower()
        if status in ("deprecated", "planned"):
            continue
        if pid not in spec_ids:
            warnings.append(f"sitemap page `{pid}` missing proto-spec/{pid}.md")

    # Empty groups referenced by nothing
    for gid in sorted(groups - group_refs):
        # L1 products may be empty placeholders — only warn for mod-*
        if gid.startswith("mod-"):
            warnings.append(f"group `{gid}` has no pages; remove empty module group if intentional")

    # HTML without sitemap (orphan pages)
    for hid in sorted(html_ids - sitemap_ids):
        warnings.append(f"pages/{hid}.html not listed in sitemap")

    print_report(errors, warnings)
    if args.fix and errors:
        return 1
    return 0


def print_report(errors, warnings):
    if not errors and not warnings:
        print("OK: pages ↔ sitemap ↔ proto-spec look in sync")
        return
    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
    if warnings:
        print("WARNINGS:")
        for w in warnings:
            print(f"  - {w}")


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Validate the Runtime's explicit multiline sitemap without extra dependencies.

--stage spec permits missing HTML; prototype checks selected active pages.
This structural check does not establish business authorization.
"""
from __future__ import annotations
import argparse
import re
import sys
from pathlib import Path


def scalar(value):
    value = re.split(r"\s+#", value.strip(), maxsplit=1)[0].strip()
    if value[:1] in ('"', "'"):
        if len(value) < 2 or value[-1] != value[0]:
            raise ValueError("unclosed quoted scalar")
        return value[1:-1]
    return value


def parse_sitemap(text):
    pages, groups, refs = [], set(), set()
    section, stack, seen_sections = None, [], set()
    for number, line in enumerate(text.splitlines(), 1):
        if not line.strip() or line.lstrip().startswith('#'):
            continue
        if '\t' in line:
            raise ValueError(f"line {number}: tabs are unsupported")
        indent = len(line) - len(line.lstrip())
        body = line.strip()
        if indent == 0:
            m = re.fullmatch(r'([\w-]+):\s*(.*)', body)
            if not m:
                raise ValueError(f"line {number}: expected top-level key")
            section = m[1] if m[1] in ('pages', 'groups') else None
            stack = []
            if section:
                if section in seen_sections:
                    raise ValueError(f"duplicate section {section}")
                seen_sections.add(section)
                if scalar(m[2]) not in ('', '[]'):
                    raise ValueError(f"{section}: use multiline entries or []")
            continue
        if section is None:
            continue
        m = re.fullmatch(r'-\s+id:\s*(.+)', body)
        if m:
            while stack and stack[-1][0] >= indent:
                stack.pop()
            pid = scalar(m[1])
            if not re.fullmatch(r'[A-Za-z0-9_-]+', pid):
                raise ValueError(f"line {number}: invalid id {pid}")
            node = {'id': pid}
            if section == 'pages':
                if stack and stack[-1][1].get('groupId'):
                    node['groupId'] = stack[-1][1]['groupId']
                pages.append(node)
            else:
                if pid in groups:
                    raise ValueError(f"duplicate group {pid}")
                groups.add(pid)
            stack.append((indent, node))
            continue
        while stack and stack[-1][0] >= indent:
            stack.pop()
        m = re.fullmatch(r'([\w-]+):\s*(.*)', body)
        if not m or not stack:
            raise ValueError(f"line {number}: expected entry property")
        key, value = m[1], scalar(m[2])
        if key == 'children':
            if value not in ('', '[]'):
                raise ValueError('children: use multiline entries or []')
        else:
            if key in stack[-1][1] and key != 'groupId':
                raise ValueError(f"line {number}: duplicate property {key}")
            stack[-1][1][key] = value
            if key == 'groupId':
                refs.add(value)
    if 'pages' not in seen_sections:
        raise ValueError('missing pages section')
    return pages, groups, refs


def metadata(path):
    text = path.read_text(encoding='utf-8')
    if path.suffix == '.md':
        match = re.match(r'^---\s*\n(.*?)\n---(?:\s*\n|$)', text, re.S)
        if not match:
            return {}
        text = match[1]
    return {m[1]: scalar(m[2]) for line in text.splitlines()
            if (m := re.match(r'^\s*(id|name):\s*(.+)', line))}


def check(root, stage='prototype', selected=()):
    root = root.resolve()
    errors, warnings = [], []
    try:
        pages, groups, refs = parse_sitemap((root/'sitemap.yaml').read_text(encoding='utf-8'))
    except (OSError, ValueError) as exc:
        return [str(exc)], warnings
    ids = {p['id'] for p in pages}
    if len(ids) != len(pages):
        errors.append('duplicate page IDs')
    for pid in set(selected) - ids:
        errors.append(f'unknown selected page: {pid}')
    for gid in refs - groups:
        errors.append(f'unknown group: {gid}')
    paths = set()
    for page in pages:
        pid = page['id']
        status = page.get('status', 'draft')
        if status not in ('planned', 'draft', 'reviewing', 'confirmed', 'deprecated'):
            errors.append(f'{pid}: unknown status {status}')
        active = status not in ('planned', 'deprecated')
        required = active and (not selected or pid in selected)
        relative = page.get('path') or f'pages/{pid}.html'
        path = (root/relative).resolve()
        if not path.is_relative_to(root) or path.suffix != '.html':
            errors.append(f'{pid}: invalid local HTML path {relative}')
            continue
        if path in paths:
            errors.append(f'{pid}: duplicate HTML path {relative}')
        paths.add(path)
        if stage == 'prototype' and required and not path.is_file():
            errors.append(f'{pid}: missing HTML {relative}; check batch scope and implementation')
        flat, legacy = root/'proto-spec'/f'{pid}.md', root/'proto-spec'/pid
        spec = flat if flat.is_file() else legacy/'spec.md'
        meta = legacy/'meta.yaml'
        legacy_content = any((legacy/name).is_file() for name in ('business.md', 'flow.md', 'fields.yaml', 'interaction.md'))
        if not spec.is_file() and not (meta.is_file() and legacy_content):
            if required:
                errors.append(f'{pid}: missing page Spec')
            continue
        data = metadata(spec) if spec.is_file() else {}
        if not data and meta.is_file():
            data = metadata(meta)
        if data.get('id') != pid or not data.get('name'):
            errors.append(f'{pid}: Spec metadata must contain matching id and nonempty name')
    specdir = root/'proto-spec'
    if specdir.is_dir():
        for p in specdir.iterdir():
            if (p.is_file() and p.suffix == '.md') or (p.is_dir() and ((p/'spec.md').exists() or (p/'meta.yaml').exists())):
                if p.stem not in ids:
                    errors.append(f'{p.name}: Spec has no sitemap mapping; reconcile sources, do not auto-delete')
    for p in (root/'pages').rglob('*.html'):
        if p.resolve() not in paths:
            warnings.append(f'{p.relative_to(root)}: HTML not mapped in sitemap')
    return errors, warnings


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('root', type=Path)
    parser.add_argument('--stage', choices=('spec', 'prototype'), default='prototype')
    parser.add_argument('--page-id', action='append', default=[])
    parser.add_argument('--fix', action='store_true', help='deprecated compatibility flag; never mutates files')
    args = parser.parse_args()
    try:
        errors, warnings = check(args.root.resolve(), args.stage, args.page_id)
    except (OSError, ValueError) as exc:
        errors, warnings = [str(exc)], []
    for label, items in [('ERROR', errors), ('WARNING', warnings)]:
        for item in items:
            print(f'{label}: {item}')
    if not errors:
        print(f'OK: {args.stage} structural check passed (not business approval)')
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main())

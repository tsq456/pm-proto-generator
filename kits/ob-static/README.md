# OceanBase Static Kit

Static CSS kit that mirrors [OceanBase Design](https://github.com/oceanbase/oceanbase-design) for **HTML prototypes** (no React, no build).

## Why this exists

`@oceanbase/design` is a React + CSS-in-JS library. Component styles are injected at runtime, so you cannot drop the npm package into a static HTML zip and get Buttons/Tables for free.

What *can* be reused:

| Asset | Source | Use in static HTML |
| --- | --- | --- |
| `--ob-*` Design Tokens | `tokens/ob-css-vars.reference.css` in `@oceanbase/design` | Yes — vendor as `tokens.css` |
| Component look & feel | Recreated with tokens | Yes — `components.css` |
| Real React components | UMD `dist/design.min.js` | Optional high-fidelity mode only |

## Files

- `icons/` — 开源图标（Heroicons MIT）；侧栏 caret 等，见 `icons/README.md`
- `tokens.css` — official OceanBase CSS variables (default theme)
- `components.css` — layout, menu, button, form, table, **filter panel**, **P0/P1 controls** (datepicker/switch/cascader…), drawer, modal…
- `filter-dropdown.js` — OB Filter 浮层面板开合（查询枚举默认多选 + 数值范围选择器；勿用原生 select，范围不要铺在筛选行）
- `controls.js` — DatePicker / TimePicker / Cascader / TreeSelect 开合 + Switch + **侧栏 `.ob-menu__group` 展开收起** + **`ObToast` 轻提示**
- `popover.js` — 气泡卡片。悬停带 `data-ob-popover` 的元素，可选 `data-ob-popover-title`
- `prototype.css` — package index / PRD doc chrome（历史 annotation 样式可忽略）

## Usage

```html
<link rel="stylesheet" href="../kits/ob-static/tokens.css" />
<link rel="stylesheet" href="../kits/ob-static/components.css" />
<link rel="stylesheet" href="../kits/ob-static/prototype.css" />
<script src="../kits/ob-static/filter-dropdown.js"></script>
<script src="../kits/ob-static/controls.js"></script>
```

Prefer class prefix `ob-*`（见 `references/component-catalog.md` 与 `references/controls/`）。Do not invent random utility classes.

## Fidelity note

This kit aims for **visual handoff fidelity** (color, type, radius, spacing, common controls), not pixel-perfect parity with every React component. Downstream engineers should still implement with `@oceanbase/design`.

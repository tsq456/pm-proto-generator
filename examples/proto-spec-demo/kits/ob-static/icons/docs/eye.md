---
id: eye
name: Eye
set: heroicons
version: "2.2.0"
license: MIT
keywords:
  - eye
  - view
  - visible
files:
  - size: 24
    style: outline
    path: heroicons/24/outline/eye.svg
  - size: 24
    style: solid
    path: heroicons/24/solid/eye.svg
  - size: 20
    style: solid
    path: heroicons/20/solid/eye.svg
  - size: 16
    style: solid
    path: heroicons/16/solid/eye.svg
---

# eye

- **显示名**: Eye
- **来源**: Heroicons v2.2.0（MIT）
- **关键词**: eye, view, visible

## 文件

| size | style | path |
| --- | --- | --- |
| 24 | outline | `heroicons/24/outline/eye.svg` |
| 24 | solid | `heroicons/24/solid/eye.svg` |
| 20 | solid | `heroicons/20/solid/eye.svg` |
| 16 | solid | `heroicons/16/solid/eye.svg` |

## 引用示例

**内联 SVG（描边随 currentColor）**

```html
<img class="ob-icon" src="../kits/ob-static/icons/heroicons/24/outline/eye.svg" alt="" width="20" height="20" />
<!-- 或直接内联打开该 svg，将 stroke 设为 currentColor -->
```

**CSS mask（随文字色）**

```css
.my-icon {
  width: 20px; height: 20px;
  background-color: currentColor;
  -webkit-mask: url("../kits/ob-static/icons/heroicons/20/solid/eye.svg") center / contain no-repeat;
  mask: url("../kits/ob-static/icons/heroicons/20/solid/eye.svg") center / contain no-repeat;
}
```


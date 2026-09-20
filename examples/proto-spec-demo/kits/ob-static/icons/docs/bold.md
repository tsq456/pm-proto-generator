---
id: bold
name: Bold
set: heroicons
version: "2.2.0"
license: MIT
keywords:
  - bold
files:
  - size: 24
    style: outline
    path: heroicons/24/outline/bold.svg
  - size: 24
    style: solid
    path: heroicons/24/solid/bold.svg
  - size: 20
    style: solid
    path: heroicons/20/solid/bold.svg
  - size: 16
    style: solid
    path: heroicons/16/solid/bold.svg
---

# bold

- **显示名**: Bold
- **来源**: Heroicons v2.2.0（MIT）
- **关键词**: bold

## 文件

| size | style | path |
| --- | --- | --- |
| 24 | outline | `heroicons/24/outline/bold.svg` |
| 24 | solid | `heroicons/24/solid/bold.svg` |
| 20 | solid | `heroicons/20/solid/bold.svg` |
| 16 | solid | `heroicons/16/solid/bold.svg` |

## 引用示例

**内联 SVG（描边随 currentColor）**

```html
<img class="ob-icon" src="../kits/ob-static/icons/heroicons/24/outline/bold.svg" alt="" width="20" height="20" />
<!-- 或直接内联打开该 svg，将 stroke 设为 currentColor -->
```

**CSS mask（随文字色）**

```css
.my-icon {
  width: 20px; height: 20px;
  background-color: currentColor;
  -webkit-mask: url("../kits/ob-static/icons/heroicons/20/solid/bold.svg") center / contain no-repeat;
  mask: url("../kits/ob-static/icons/heroicons/20/solid/bold.svg") center / contain no-repeat;
}
```


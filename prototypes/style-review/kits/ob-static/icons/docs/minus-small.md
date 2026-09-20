---
id: minus-small
name: Minus Small
set: heroicons
version: "2.2.0"
license: MIT
keywords:
  - minus-small
  - minus
  - small
files:
  - size: 24
    style: outline
    path: heroicons/24/outline/minus-small.svg
  - size: 24
    style: solid
    path: heroicons/24/solid/minus-small.svg
  - size: 20
    style: solid
    path: heroicons/20/solid/minus-small.svg
---

# minus-small

- **显示名**: Minus Small
- **来源**: Heroicons v2.2.0（MIT）
- **关键词**: minus-small, minus, small

## 文件

| size | style | path |
| --- | --- | --- |
| 24 | outline | `heroicons/24/outline/minus-small.svg` |
| 24 | solid | `heroicons/24/solid/minus-small.svg` |
| 20 | solid | `heroicons/20/solid/minus-small.svg` |

## 引用示例

**内联 SVG（描边随 currentColor）**

```html
<img class="ob-icon" src="../kits/ob-static/icons/heroicons/24/outline/minus-small.svg" alt="" width="20" height="20" />
<!-- 或直接内联打开该 svg，将 stroke 设为 currentColor -->
```

**CSS mask（随文字色）**

```css
.my-icon {
  width: 20px; height: 20px;
  background-color: currentColor;
  -webkit-mask: url("../kits/ob-static/icons/heroicons/20/solid/minus-small.svg") center / contain no-repeat;
  mask: url("../kits/ob-static/icons/heroicons/20/solid/minus-small.svg") center / contain no-repeat;
}
```


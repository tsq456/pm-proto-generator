---
id: paper-clip
name: Paper Clip
set: heroicons
version: "2.2.0"
license: MIT
keywords:
  - paper-clip
  - paper
  - clip
  - attachment
  - attach
files:
  - size: 24
    style: outline
    path: heroicons/24/outline/paper-clip.svg
  - size: 24
    style: solid
    path: heroicons/24/solid/paper-clip.svg
  - size: 20
    style: solid
    path: heroicons/20/solid/paper-clip.svg
  - size: 16
    style: solid
    path: heroicons/16/solid/paper-clip.svg
---

# paper-clip

- **显示名**: Paper Clip
- **来源**: Heroicons v2.2.0（MIT）
- **关键词**: paper-clip, paper, clip, attachment, attach

## 文件

| size | style | path |
| --- | --- | --- |
| 24 | outline | `heroicons/24/outline/paper-clip.svg` |
| 24 | solid | `heroicons/24/solid/paper-clip.svg` |
| 20 | solid | `heroicons/20/solid/paper-clip.svg` |
| 16 | solid | `heroicons/16/solid/paper-clip.svg` |

## 引用示例

**内联 SVG（描边随 currentColor）**

```html
<img class="ob-icon" src="../kits/ob-static/icons/heroicons/24/outline/paper-clip.svg" alt="" width="20" height="20" />
<!-- 或直接内联打开该 svg，将 stroke 设为 currentColor -->
```

**CSS mask（随文字色）**

```css
.my-icon {
  width: 20px; height: 20px;
  background-color: currentColor;
  -webkit-mask: url("../kits/ob-static/icons/heroicons/20/solid/paper-clip.svg") center / contain no-repeat;
  mask: url("../kits/ob-static/icons/heroicons/20/solid/paper-clip.svg") center / contain no-repeat;
}
```


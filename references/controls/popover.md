# 气泡卡片（Popover）

对齐 OceanBase Design 气泡卡片的静态薄补。正式实现用 `@oceanbase/design` 的 Popover。不宣称像素级一致。

## 引入

页面已引入 `components.css` 时，再加：

```html
<script src="../kits/ob-static/popover.js"></script>
```

## 骨架

悬停触发元素即可。正文写在 `data-ob-popover`，标题可选。

```html
<span data-ob-popover-title="完整路径" data-ob-popover="临空产业园 / 临空东区">临空东区</span>
```

卡片默认出现在触发元素上方，箭头指向触发元素。上方空间不够时改到下方。滚动或改变窗口大小时收起。

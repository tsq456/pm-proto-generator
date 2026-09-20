# Icons（Heroicons 全量）

本目录 vendoring [Heroicons](https://heroicons.com/) **v2.2.0** 优化 SVG，供静态原型包引用。

| 项 | 值 |
| --- | --- |
| 许可 | MIT（见 `LICENSE.heroicons.txt`） |
| 上游 | https://github.com/tailwindlabs/heroicons @ v2.2.0 |
| 图标数 | 324（每套） |
| 变体 | 24 outline / 24 solid / 20 solid（mini）/ 16 solid（micro） |
| 机读总表 | `catalog.yaml` |
| 单图标说明 | `docs/<id>.md`（YAML frontmatter + 路径） |

## 目录

```text
icons/
  catalog.yaml           # 全量机读索引
  LICENSE.heroicons.txt
  docs/<icon-id>.md      # 每个图标一份
  heroicons/
    24/outline/*.svg
    24/solid/*.svg
    20/solid/*.svg
    16/solid/*.svg
```

## 在原型页中引用

路径相对 `pages/*.html`：

```html
<!-- 推荐：内联或 img；outline 适合描边图标 -->
<img src="../kits/ob-static/icons/heroicons/24/outline/magnifying-glass.svg" width="16" height="16" alt="" />
```

CSS mask（实心 mini，随 `currentColor`）：

```css
.ob-menu__group-caret {
  background-color: currentColor;
  -webkit-mask: url("./icons/heroicons/20/solid/chevron-down.svg") center / 14px 14px no-repeat;
  mask: url("./icons/heroicons/20/solid/chevron-down.svg") center / 14px 14px no-repeat;
}
```

Agent / 脚本选型：读 `catalog.yaml`，按 `keywords` / `id` 匹配后取 `files[].path`。

## 变体选用

| 变体 | 场景 |
| --- | --- |
| `24/outline` | 默认 UI 图标、侧栏、按钮旁 |
| `24/solid` | 强调、选中态 |
| `20/solid` | 紧凑控件、CSS mask |
| `16/solid` | 表格操作列、标签内极小图标 |

## 升级

从上游 `optimized/` 覆盖 `heroicons/`，再运行技能仓维护脚本重新生成 `docs/` 与 `catalog.yaml`（见仓库 `scripts/sync_heroicons.py`，若已提供）。

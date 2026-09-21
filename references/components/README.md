# 组件级规范（P0）

> 本文为上游未指定时的 kit 默认表现。已确认页面 Spec 的布局、列序、字段、交互与能力边界优先；不据此新增业务能力。

在 `layouts/` 选型之后，按本目录补齐**间距 / 分区 / 状态 / 禁止项**。类名一律 `ob-*`，Token 来自 `kits/ob-static/tokens.css`。

表单先定载体（弹窗 / 抽屉 / 整页）：[form-carrier.md](../form-carrier.md)。

| 组件 | 文件 | 对应 layout |
| --- | --- | --- |
| 工作台壳层 | [chrome.md](./chrome.md) | [app-shell](../layouts/app-shell.md) · [app-shell-multi](../layouts/app-shell-multi.md) |
| 列表页三区 | [list-page.md](./list-page.md) | [list-filter-table](../layouts/list-filter-table.md) |
| 查询筛选 | [filter-form.md](./filter-form.md) | 同上 |
| 数据表格 | [data-table.md](./data-table.md) | 同上 |
| 分页 | [pagination.md](./pagination.md) | 同上 |
| 详情页 | [detail-page.md](./detail-page.md) | [detail-descriptions](../layouts/detail-descriptions.md) |
| 整页表单 | [form-page.md](./form-page.md) | [form-page](../layouts/form-page.md) |
| 弹窗 / 抽屉 | [overlay-ui.md](./overlay-ui.md) | [form-in-modal](../layouts/form-in-modal.md) · [form-in-drawer](../layouts/form-in-drawer.md) |
| **业务页模式** | [biz-page/](./biz-page/README.md) | 档案弹窗编辑 / 分区发布 / 镜像详情 / 状态机详情 |

## 共用 Token（速查）

| Token | 值 | 典型用途 |
| --- | --- | --- |
| `--ob-space-200` | 8px | 筛选项 gap、按钮间距 |
| `--ob-space-300` | 12px | 卡头/分页竖向 padding |
| `--ob-space-400` | 16px | 卡体 padding、`.ob-stack` 卡间距 |
| `--ob-space-500` | 20px | 抽屉 body、Modal 水平 padding |
| `--ob-space-600` | 24px | `.ob-content` 内边距 |
| `--ob-radius-sm/md/lg` | 4 / 6 / 8px | 控件 / 卡 / Modal |

完整执行约束见 [逐页实现选型](../page-implementation.md)。选出组件后必须检查目标包和 kit 的实际实现、行为与依赖，再确定复用、组合、适配或新增；以下仅是规范阅读顺序。

## Agent 阅读顺序

1. `layouts/README.md` 选型  
2. 若是整页业务组合（档案弹窗 / 发布 / 履约）→ [biz-page/](./biz-page/README.md)  
3. 打开对应 layout 骨架 + 本目录通用组件细则  
4. 复杂控件再读 `references/controls/`  

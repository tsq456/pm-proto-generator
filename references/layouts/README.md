# 中后台布局规范索引

> 本文为上游未指定时的 kit 默认表现。已确认页面 Spec 的布局、列序、字段、交互与能力边界优先；不据此新增业务能力。

写任意业务页前，先按意图选型，再打开对应规范文件，**按骨架复制结构**，只替换业务文案与字段。

正式实现可对照 `ob-design template <name>` / `ob-design route "<意图>"`；本仓库交付仍为静态 HTML。

间距 / 分区 / 状态 / 禁止项的**组件级细则**见 [../components/](../components/README.md)（P0）。

**表单用弹窗、抽屉还是整页？** 先读 [form-carrier.md](../form-carrier.md)，再打开下表对应骨架。

## 选型表

| 意图关键词 | 规范文件 | 组件级细则 | 对应官方模板 / 组件 |
| --- | --- | --- | --- |
| 单应用壳、侧栏主导航 | [app-shell.md](./app-shell.md) | [chrome](../components/chrome.md) | `app-basic-layout` · BasicLayout |
| 多应用壳、顶栏切换应用、侧栏为应用内导航 | [app-shell-multi.md](./app-shell-multi.md) | [chrome](../components/chrome.md) | 顶栏 L1 + 侧栏 L2（大型中台） |
| 列表、筛选、表格、分页 | [list-filter-table.md](./list-filter-table.md) | [list-page](../components/list-page.md) · [filter-form](../components/filter-form.md) · [data-table](../components/data-table.md) · [pagination](../components/pagination.md) | `list-filter-table` · Filter + Table |
| 只读详情、描述列表（含字段摆放顺序） | [detail-descriptions.md](./detail-descriptions.md) | [detail-page](../components/detail-page.md) | `detail-descriptions` · Descriptions |
| 弹窗内表单 | [form-in-modal.md](./form-in-modal.md) | [overlay-ui](../components/overlay-ui.md) | `form-in-modal` · Form + Modal |
| 抽屉内表单 / 抽屉详情 | [form-in-drawer.md](./form-in-drawer.md) | [overlay-ui](../components/overlay-ui.md) | Form/Descriptions + Drawer |
| 整页新建/编辑、分步向导 | [form-page.md](./form-page.md) | [form-page](../components/form-page.md) · 发布组合见 [biz-page/sectioned-form](../components/biz-page/sectioned-form.md) | 自建（PageContainer + Form） |
| 档案页内编辑、镜像详情、状态机履约 | 见 biz-page | [biz-page/](../components/biz-page/README.md) | 组合模式 |
| 概览、KPI、图表 | [chart-overview.md](./chart-overview.md) | — | @oceanbase/charts 语义占位 |
| 成功/失败结果页 | [result-page.md](./result-page.md) | — | Result |

## 通用规则（各页型共用）

1. **壳层一致**：同包只选一种壳——`app-shell`（单应用）或 `app-shell-multi`（多应用）；侧栏/顶栏与 sitemap 映射见对应 layout + chrome。
2. **页容器分区**：页头（标题+操作）→ 内容区卡片栈 →（可选）底栏工具条。
3. **间距**：内容卡之间用 `.ob-stack`（gap `--ob-space-400` = 16px）；内容区内边距由 `.ob-content`（`--ob-space-600`）提供。细则见 components。
4. **筛选**：列表筛选用 `.ob-filter` + Filter 浮层面板；禁止一排裸 `.ob-select` 充当筛选条。见 [filter-form](../components/filter-form.md)。
5. **表格入卡**：列表主表用 `.ob-card__body--flush` 贴边，分页同卡底部。列表主表默认最左一列复选；可展开表的箭头在复选框左侧。勾选后底栏左侧显示已选数量、取消和批量按钮。详情内嵌表默认 `.ob-table--no-select`（仅有批量操作才开复选）。详情 Tab / 与 `.ob-desc` 同卡的内嵌表用普通 `.ob-card__body` 留边，禁止 `--flush`；表上操作放 `.ob-panel-toolbar` 左上方。见 [data-table](../components/data-table.md) / [detail-page](../components/detail-page.md) / [pagination](../components/pagination.md)。
6. **浮层**：Modal/Drawer 用 `.ob-mask` + `.is-open`；禁止 `alert()`。见 [overlay-ui](../components/overlay-ui.md)。
7. **类名**：仅用 `ob-*` / Runtime `ps-*`；禁止 `ant-*`。
8. **文案**：真实中文业务文案；禁止 lorem。

## 工作流中的位置

```
澄清范围 → 表单载体选型 form-carrier.md（若有表单）
  → 为每个页面选型（本索引）
  → 整页业务组合先看 components/biz-page/
    → 打开对应 layout 骨架 + components 细则
    → mount ProtoSpecRuntime → 同步 sitemap 导航
```

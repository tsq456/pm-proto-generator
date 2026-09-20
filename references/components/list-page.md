# 列表页三区布局（List Page）

> 本文为上游未指定时的 kit 默认表现。已确认页面 Spec 的布局、列序、字段、交互与能力边界优先；不据此新增业务能力。

骨架见 [list-filter-table](../layouts/list-filter-table.md)。筛选 / 表格 / 分页细则见同目录对应文件。

## 何时使用

- 工作台内容区内的标准「查询 + 表格 + 分页」页

**不要**筛选卡与列表卡贴死无间距；**不要**把分页拆到另一张卡。

---

## 标准双卡片（推荐）

```
.ob-content
├─ .ob-page-title          ← 仅 h1 + 主 CTA（默认无副文本）
└─ .ob-stack               ← gap: 16px（--ob-space-400），灰底透出
   ├─ .ob-card 筛选卡      ← 无 card__head / 无「筛选条件」标题
   │    └─ .ob-card__body → .ob-filter
   └─ .ob-card 列表卡      ← 默认无「××列表」标题；工具栏可用 __toolbar
        ├─ （可选）.ob-card__toolbar 仅放导出/列设置等，不重复页名
        └─ .ob-card__body--flush
             ├─ .ob-table-wrap > .ob-table
             └─ .ob-table-footer（总数 + .ob-pagination）
```

| 区域 | Token / 规则 |
| --- | --- |
| 内容区背景 | `--ob-color-bg-secondary`（卡间距处透出） |
| 卡间距 | `.ob-stack` → `gap: var(--ob-space-400)` = **16px** |
| 页头 | 只有 `h1` + actions；**不要**默认副文本 `<p>` |
| 筛选卡 | **不要** `.ob-card__head`；body 直接放 `.ob-filter` |
| 列表卡 | **不要**再写与页头相同的「××列表」标题；有工具按钮时用右对齐 toolbar，无标题文字 |
| 列表卡表格区 | `--flush` 无内边距，表格贴边 |
| 分页区 | `.ob-table-footer`：`padding: 12px 16px`，与表格同卡 |

### 单面板（可选）

仅当用户明确要求「一张大卡」：同一 `.ob-card` 内筛选区 + 底部分割线 + flush 表格 + footer。筛选区用 `border-bottom: 1px solid var(--ob-color-divider)` 与表格分隔，**无**块间距灰底。

---

## 按钮落位

| 按钮 | 位置 |
| --- | --- |
| 新建 / 主 CTA | `.ob-page-title__actions`。这是写死的位置，不要放到筛选卡、列表卡或表格上方 |
| 查询 / 重置 | 筛选卡 `.ob-filter` 右侧（`__spacer` 后） |
| 批量操作（启用、停用等） | 勾选后出现在 `.ob-table-footer` 左侧。未勾选时不显示。不要放表格上方，不要「展开」 |
| 导出 / 列设置 | 列表卡顶部右缘（无标题的 toolbar）或页头次按钮 |
| 行内操作 | 表格操作列 `.ob-link`（类名打在 `td`，**勿**给 td 设 `display:flex`） |

**不要**把「新建」放进筛选卡；**不要**把「导出」放进筛选区。

---

## 右缘对齐

`.ob-table-footer` 与表格同在 `--flush` 卡体内：footer 自带左右 `16px` padding，页码右缘与表头「操作」列视觉对齐（表格单元格亦为 `12px 16px`）。

禁止给 footer 再套一层不同水平 padding 的容器。

---

## 空态 / 加载

| 状态 | 做法 |
| --- | --- |
| 无数据 | 表格区改 `.ob-empty`，可带「去新建」主按钮 |
| 加载中 | 灰文案或骨架行；勿假称真实请求 |
| 筛选无结果 | 空态文案区分「尚无数据」与「无匹配结果」 |

---

## proto-spec 对齐

列表页 `fields.yaml` / 说明中须能对应：筛选字段、列字段；`business.md` / `rules` 建议写清**数据来源**与**默认排序**。

## 禁止

- 筛选卡写「筛选条件」标题；列表卡再写一遍页名标题
- 页头默认副文本（layout 关键词说明除外；UI 交付默认隐藏）
- 装饰性卡片套卡片
- 列表筛选条使用原生 `<select>`（须 Filter 浮层，见 [filter-form](./filter-form.md)）

## Checklist

1. 双卡 + `.ob-stack`；筛选/列表卡均无冗余标题  
2. 主 CTA 在页头；页头无副文本  
3. 表格 `--flush` + 同卡分页；操作列横线对齐  
4. 引入 `filter-dropdown.js`  
5. 查询区改条件后不刷新，点「查询」才生效（见 [filter-form](./filter-form.md)）  

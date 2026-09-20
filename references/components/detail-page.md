# 详情页（Detail Page）

骨架见 [detail-descriptions](../layouts/detail-descriptions.md)。字段用 `.ob-desc`（表格式），流程用 `.ob-steps`。

## 何时使用

- 列表「详情」跳转后的只读页
- 多组分块字段、可选流程步骤 / 页签 / 子表

**不要**套用列表三区；**不要**字段无标题堆成一长页。

---

## 标准结构

### 无 Tab

```
.ob-content
├─ .ob-page-title
│    └─ .ob-page-title__main（左返回 + h1，无状态 Tag）
├─ （可选）.ob-steps
└─ .ob-stack → .ob-card（.ob-desc）
```

### 有 Tab

```
.ob-content
├─ .ob-page-title
│    └─ .ob-page-title__main
└─ section.ob-card.ob-card--tabs[data-tabs]
   ├─ .ob-card__tabs > .ob-tabs
   └─ [data-panel].ob-card__body（内嵌 .ob-desc / 表 / 占位；无重复标题）
```

| 区域 | 规则 |
| --- | --- |
| 页头 | 返回在**标题左侧**，方按钮 + 左箭头（`.ob-btn--icon` + `.ob-icon--arrow-left`），`aria-label="返回"`。标题纯文本，**不要**跟状态 Tag。仅整页级操作放右侧 actions；**不要**把「编辑基本资料」放页头（会被理解成编辑全部 Tab） |
| 描述列表 | 左标签右值；标签淡底、值列白；默认两列对；`.ob-desc--3` 见 layout；通栏项后描边仍完整；**字段顺序**按 layout「字段摆放顺序」（身份→状态→分类→归属→度量→审计→通栏收尾） |
| Tab 一体卡 | `.ob-card--tabs`；Tab 与内容同一卡片边框内 |
| 内嵌表 | 普通 `.ob-card__body` 留边，`.ob-table-wrap` 自带描边；**禁止**详情 Tab 用 `--flush` |
| 表上操作 | `.ob-panel-toolbar` **左对齐**，紧贴表格 / `.ob-desc` 上方（编辑、新增图纸、新增抵押） |
| 重复标题 | Tab 已命名的分区，panel 内禁止再写同名卡头 |

---

## 分组卡片（何时多卡 / 何时单卡）

与 [form-page](./form-page.md) 共用。

### 用多张分组卡（满足任一条）

1. 业务域不同  
2. 与编辑表单镜像分区  
3. 权限/生命周期不同  
4. 描述 vs 子表 vs 附件（后两者必须独立区）  
5. 短字段 ≥12 或 ≥2 块通栏长文  

### 不要分组

1. 同叙事短字段 ≤8～10、无子表  
2. **Tab 已表达分组** → 勿再叠同名卡头  
3. 抽屉/Modal 优先单区  
4. 禁止空卡（每卡 ≤3 字段硬拆）  

有 Tab 时：优先 **一个** `.ob-card--tabs`，用 panel 切换，而不是每个 Tab 外再套独立大卡。

---

## 流程步骤条

有明确业务阶段时，在页头下使用 `.ob-steps`（非表单向导）。


## 分组卡头

多卡详情（信息 / 子表分卡）用 `.ob-card__head` + `.ob-card__title`，**不要**在 `.ob-card__body` 里手写无样式的「分区标题」或未入 kit 的 `.ob-section-title`。

同卡内再分小段（描述表下再挂子表）用 `.ob-desc__group`。

## 详情内嵌表复选

默认 **无复选**：表格加 `.ob-table--no-select`。仅当该子表有批量操作时才开复选，细则见 [data-table](./data-table.md)「详情内嵌表」。

## 子表

日志/明细：放在对应 `data-panel` 内，或无 Tab 时用独立 `.ob-card`；见 [data-table](./data-table.md)。

详情内嵌表与 `.ob-desc` 同一形态：**相对卡片留边距**（`--ob-space-400`），wrap 自带细描边；不要贴卡片四边。

```html
<div data-panel="drawings" class="ob-card__body">
  <div class="ob-panel-toolbar">
    <button type="button" class="ob-btn ob-btn--primary ob-btn--sm">新增图纸</button>
  </div>
  <div class="ob-table-wrap">
    <table class="ob-table ob-table--no-select">…</table>
  </div>
</div>
```

基本资料「编辑」同样放该 panel 的 toolbar 左上，只作用于描述表。点击后在**当前详情页**打开 Drawer（字段同列表表单），禁止跳回列表 `?edit=`。

会离开本页的「前往某某」按钮加 `.ob-btn--jump`（文案右侧斜箭头）。

状态/分类字段按 [table-field-visual.md](./table-field-visual.md) 画，描述表与内嵌表同一套，不要用彩色 Tag 表示启停/生命周期。

## 禁止

- 详情页列表筛选条  
- 行斑马纹抢戏（标签淡底 / 值白即可）  
- 上标签下内容的旧式 Descriptions  
- Tab 下重复同名标题  
- 通栏（备注/附件）之后再排创建人、创建时间等短字段  
- 按表单填写序或后端字段序直接铺详情，跳过「字段摆放顺序」骨架  

## Checklist

1. 页头左侧图标返回；`h1` 不含状态 Tag  
2. 有 Tab → `.ob-card--tabs` 一体；无重复标题  
3. `.ob-desc` 标签淡底、值白；列数符合阈值；状态字段用 `.ob-status`  
4. `.ob-desc` 字段顺序符合 [detail-descriptions](../layouts/detail-descriptions.md)「字段摆放顺序」：通栏收尾、成对并排、审计在通栏前  
5. 操作在 `.ob-panel-toolbar` 左上（基本资料编辑 / 表上新增）；编辑打开**本页**抽屉  
6. 详情内嵌表有卡体内边距，非 `--flush`  
7. 「前往」类跳转按钮带 `.ob-btn--jump`  

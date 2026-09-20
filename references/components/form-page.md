# 整页表单（Form Page）

> 本文为上游未指定时的 kit 默认表现。已确认页面 Spec 的布局、列序、字段、交互与能力边界优先；不据此新增业务能力。

骨架见 [form-page layout](../layouts/form-page.md)。弹窗/抽屉表单见 [overlay-ui](./overlay-ui.md)。

**是否该用整页？** 先读 [form-carrier.md](../form-carrier.md)；≤8 字段优先 Modal/Drawer。

## 何时使用

- 字段多、需分区或分步的新建/编辑
- 复杂控件（日期/开关/级联/上传）见 `references/controls/`

**不要**≤8 字段还做整页（优先 Modal/Drawer）；**不要**主提交只放在页头。

---

## 分组卡片（何时多卡 / 何时单卡）

与 [detail-page](./detail-page.md) **同一套判断**。表单侧补充：跨域填写 / 分区校验 / 与详情镜像 → 多卡；同域 ≤8～10 字段或 Modal 内 → 单卡。有 Tab 的编辑页同样优先一体卡，避免 Tab 下重复标题。

---

## 标准结构

```
.ob-content
├─ .ob-page-title          ← 仅 h1（默认无副文本）；主提交在底栏
├─ （可选）.ob-steps
├─ .ob-stack → 多张 .ob-card（分区）
└─ .ob-footer-bar（取消 / 上一步 / 下一步 | 提交）
```

| 区域 | Token / 规则 |
| --- | --- |
| 分区卡间距 | `.ob-stack` 16px |
| 双列栅格 | `.ob-form-row` / `.ob-form-grid-2`：**两列占满**（`1fr 1fr`） |
| 三列栅格 | `.ob-form-row--3`：字段短、同一分区 ≥3 个并列项时扩到三列占满 |
| 行与行间距 | 相邻表单行 / 字段之间 **24px**（`--ob-space-600`） |
| 通栏字段 | `.ob-field--full` 或单独 `.ob-field`（备注等） |
| 标签 | `.ob-field__label`；必填 `<span class="req">*</span>` |
| 提示 | `.ob-field__hint` |
| 底栏 | `.ob-footer-bar` sticky，顶边分隔 + 浅阴影；主按钮在右 |

---

## 字段与控件

| 场景 | 控件 |
| --- | --- |
| 文本 / 多行 | `.ob-input` / `.ob-textarea` |
| 表单内下拉 | `.ob-select` |
| 日期 / 时间 / 开关 / 级联 / 上传 / 树选 | `references/controls/` + `controls.js` |
| 单选 / 多选 | 控件分册或 label 包裹的 kit 样式；勿裸系统控件无 class |

条件显隐、校验时机写在 `proto-spec` 的 fields / interaction，草稿不强制提交校验（若项目有此约定）。

---

## 分步向导

- 非末步：底栏「上一步 / 下一步」
- 末步：「提交」
- 步骤状态：`.ob-steps__item` 的 `.is-done` / `.is-active`

---

## 校验与提交状态

| 状态 | UI |
| --- | --- |
| 校验失败 | 字段 hint 或 `.ob-alert--error` 置顶；勿只用 toast 假反馈 |
| 提交中 | 主按钮 `disabled`，文案「提交中…」 |
| 成功 | 跳转详情/列表或 [result-page](../layouts/result-page.md) |

---

## 禁止

- 单卡超长无分区标题
- 弹窗内再套多步向导（应整页）
- 列表 Filter 浮层充当表单下拉

## Checklist

1. 业务分区多卡  
2. 必填标记统一  
3. 主提交在 `.ob-footer-bar`  
4. 复杂控件走 controls 分册  

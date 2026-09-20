# 分区镜像详情（Sectioned Detail）

> 本文为上游未指定时的 kit 默认表现。已确认页面 Spec 的布局、列序、字段、交互与能力边界优先；不据此新增业务能力。

与 [sectioned-form](./sectioned-form.md) **分区同名、字段对齐**的只读详情，便于研发对照。

依赖：[detail-page](../detail-page.md) · [overlay-ui](../overlay-ui.md)

## 何时使用

- 列表「详情」进入的资源只读页（商品/策略/服务产品等）  
- 需要与发布表单镜像，而不是另起一套字段结构  

**不要**在本页做大段编辑（跳 `sectioned-form?mode=edit`）；**不要**与 [status-detail](./status-detail.md) 混用。

---

## 页面骨架

```
.ob-content
├─ .ob-page-title
│    标题：名称 · .ob-status / .ob-tag
│    actions：返回 | 编辑（条件显隐）
└─ .ob-stack
     .ob-card 基本信息 → .ob-desc
     .ob-card 价格/规则 → .ob-desc
     .ob-card 详情 → 全宽文本（pre-wrap 或富文本只读）
     .ob-card 审核信息 → .ob-desc
```

标签/多选在只读区可用多个 `.ob-tag` 横排，勿再单独拆「标签表」分区（除非业务强制）。

---

## 与表单镜像规则（MUST）

| 规则 | 说明 |
| --- | --- |
| 分区标题一致 | 表单有「价格信息」，详情也叫「价格信息」 |
| 字段集合对齐 | 详情可少「仅编辑态」控件，不可多出表单没有的核心字段却无 Spec |
| 全宽字段 | 简介、详情说明用 `.ob-desc__item--full` |

---

## 顶栏「编辑」显隐（示例）

| 状态 | 编辑按钮 |
| --- | --- |
| 草稿 / 审核不通过 / 已通过待上架 | 显示 |
| 审核中 | 隐藏（或禁用 + hint） |
| 已下架 | 按业务：显示「重新编辑」或隐藏 |
| 监管端只读角色 | 永不显示 |

具体以 Spec 状态机为准，上表仅为默认推荐。

---

## proto-spec

- overview：来源列表、返回路径、与发布页关系  
- fields：按分区；与 form 对照  
- interaction：编辑跳转条件  

## 禁止

- 详情分区命名与表单漂移  
- 把履约材料/接单操作做进本页（那是 status-detail）  
- 页内 inline 大表单冒充「编辑」  

## Checklist

1. 页头状态 + 条件编辑  
2. 分区与 sectioned-form 镜像  
3. 审核区只读  
4. 列表入口 path 与 sitemap 一致  

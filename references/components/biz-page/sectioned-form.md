# 分区发布表单（Sectioned Form）

> 本文为上游未指定时的 kit 默认表现。已确认页面 Spec 的布局、列序、字段、交互与能力边界优先；不据此新增业务能力。

整页**多分区**新建/编辑（商品、策略、服务、配置等），可选流程步骤 + 底栏提交。

依赖：[form-page](../form-page.md) · [overlay-ui](../overlay-ui.md) · `references/controls/`

## 何时使用

- 字段多、需分区；常有「填写 → 审核 → 生效」链路  
- 同页 `mode=create|edit`  
- 用户说「发布」「上架表单」「分步填写」

**不要**用 Modal 承载（字段过多）；短档案用 [profile-edit-modal](./profile-edit-modal.md)。

成对只读页：[sectioned-detail](./sectioned-detail.md)（分区名须镜像）。

---

## 页面骨架

```
.ob-content
├─ .ob-page-title
│    标题（新建 / 编辑 · 名称 · 状态标签）
│    actions：返回 | 保存草稿 | 提交审核（主）
├─ .ob-steps                    // 仅新建示意；编辑态可隐藏
├─ .ob-stack
│    .ob-card 基本信息 → .ob-form-grid-2
│    .ob-card 价格/规则 → …
│    .ob-card 详情 → textarea / 富文本占位
│    .ob-card#audit（编辑态）→ .ob-desc 只读审核信息
└─ .ob-footer-bar
     可选：协议勾选（__extra）
     取消 | 提交
```

页头与底栏都可放提交；**至少底栏有主提交**（见 form-page）。

---

## 分区建议（可按业务改名，勿拆乱镜像）

| 分区 | 典型字段 |
| --- | --- |
| 基本信息 | 名称、类型、标签/多选、简介、适用范围 |
| 价格 / 规则 | 计价方式、金额、有效期、库存或配额 |
| 详情 | 长文本 / 使用说明 / 富文本占位 |
| 审核信息 | 仅 edit：状态、审核人、时间、意见（只读 `.ob-desc`） |

表单原子：

| 类名 | 用途 |
| --- | --- |
| `.ob-form-grid-2` | 双列 |
| `.ob-field--full` | 跨两列 |
| `.ob-field__label` + `.req` | 必填 |
| `.ob-field__hint` | 字数/尺寸提示 |
| controls/* | 日期、开关、上传、级联 |

---

## 流程步骤条

与详情履约步骤区分：此处表示**发布审核进度**（示意）。

| 步骤示例 | 说明 |
| --- | --- |
| 1 填写信息 | 新建默认 `.is-active` |
| 2 审核中 | 提交后 |
| 3 已通过 | 终态 |

- **新建**：展示 `.ob-steps`  
- **编辑**：隐藏步骤条；标题带状态 `.ob-tag` / `.ob-status`；展示审核只读区  

---

## 条件字段

- 计价方式切换 → 显隐金额/单位（interaction + fields 写清）  
- 「保存草稿」弱校验；「提交审核」强校验必填  
- 协议勾选：未勾选禁用提交（演示可用 disabled）  

---

## proto-spec

- flow：步骤与状态  
- fields：按分区列出；条件显隐  
- interaction：草稿 / 提交 / 返回拦截（有改动时确认）  

## 禁止

- 单卡超长无分区标题  
- 分区名与详情页不一致（破坏镜像）  
- 列表 Filter 浮层充当表单下拉  

## Checklist

1. 多卡分区 + 双列表单  
2. 新建有步骤条；编辑有审核只读区  
3. 底栏主提交 + 可选协议  
4. 与 sectioned-detail 分区对齐  

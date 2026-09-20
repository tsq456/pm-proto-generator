# 档案编辑

只读档案页上改基本信息，**默认右侧抽屉**，不跳独立编辑页。仅当用户明确要求「编辑放弹窗」时，才用宽 Modal。

依赖：[detail-page](../detail-page.md) · [form-in-drawer](../../layouts/form-in-drawer.md) · [form-carrier](../../form-carrier.md)  
用户明确要求弹窗时，才用下方 Modal 骨架。

## 何时使用

- 机构 / 企业 / 服务商 / 账号**基本信息**
- 主数据大部分只读，少量字段可改
- 默认单列抽屉；字段成对或大约 ≥8 个时用双列宽抽屉

标准范例（本仓库 demo）：`examples/proto-spec-demo/pages/inspect-plan-detail.html`。

---

## 页面骨架

```
.ob-content
├─ .ob-page-title（可选：标题；返回）
└─ .ob-card
     ├─ .ob-card__head
     │    .ob-card__title 基本信息
     │    button.ob-btn--primary 编辑信息
     └─ .ob-card__body
          dl.ob-desc …只读字段…

.ob-mask#editMask
  .ob-modal.ob-modal--wide
    __head 编辑信息 + 右上角关闭图标（`.ob-modal__close`）
    __body（max-height:70vh; overflow:auto）
      .ob-stack
        section 可编辑信息 → .ob-form-grid-2
        section 证照/附件 → 上传列表（controls/upload）
    __foot 取消 | 保存
```

---

## 布局要点

### 只读主卡

| 元素 | 规范 |
| --- | --- |
| 卡头 | 左标题、右「编辑信息」主按钮 |
| 字段 | `.ob-desc` 多列（上标签下内容；默认 3 列） |
| 主数据 | 名称、编码、类型、准入状态等建议**只读**，弹窗内不提供编辑 |
| 脱敏 | 只读页可脱敏手机/邮箱；弹窗填**明文**，保存后回写（演示可再脱敏） |

### 宽弹窗

| 元素 | 规范 |
| --- | --- |
| 宽度 | `.ob-modal--wide`（`min(720px, …)`） |
| 滚动 | `__body` 设 `max-height: 70vh; overflow: auto`（页内 style 即可） |
| 表单 | `.ob-form-grid-2`；跨列 `.ob-field--full` |
| 附件 | `references/controls/upload.md`；可多份 + 删除演示 |
| 开合 | mask + modal 成对 `.is-open`；禁止 `alert` |

---

## 交互规则

1. 「编辑信息」→ 回填当前值 → 打开 Modal  
2. 取消 / 点遮罩（若允许）→ 不落库  
3. 保存 → 校验必填 → 更新只读 `.ob-desc` → `.ob-alert` 成功提示或关窗  
4. 附件：追加 / 删除仅演示态  

---

## proto-spec

- **页面定位**：只读 + 弹窗编辑，非独立编辑页  
- **fields**：标注 `readonly` vs `editable`  
- **interaction**：编辑 / 保存 / 附件  
- **权限**：本机构可编；监管端常只读（无编辑按钮）  

## 禁止

- 用窄默认 Modal（440px）塞双列表单  
- 弹窗内再套分步向导  
- 主数据在只读页可点改、弹窗却不能改（规则要一致）  

## Checklist

1. 卡头编辑按钮 + `.ob-desc`  
2. `.ob-modal--wide` + 双列表单  
3. 主数据只读边界写进 Spec  

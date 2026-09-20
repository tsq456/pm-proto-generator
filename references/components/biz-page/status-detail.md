# 状态机详情（Status Detail）

按**状态切换顶栏操作**，多卡展示主体信息 + 环节材料 + 全程日志。适用于订单、工单、审批履约等。

依赖：[detail-page](../detail-page.md) · [overlay-ui](../overlay-ui.md) · [data-table](../data-table.md)

## 何时使用

- 一单多状态、操作随状态变  
- 需要材料累积展示 + 操作日志  
- 用户说「订单详情」「接单拒单」「工单处理」「全程日志」

**不要**与商品/资源配置详情（[sectioned-detail](./sectioned-detail.md)）混用。  
垂直时间轴与**表格式日志**二选一；履约类推荐日志表。

---

## 页面骨架（多卡叠放）

与单卡 detail-page 的差异：**顶栏可独立成卡**，信息 / 材料 / 日志分卡纵向 `.ob-stack`。

```
.ob-content > .ob-stack
  .ob-card                        // ① 顶栏卡（可与信息合并，复杂状态推荐独立）
    .ob-card__body
      左：单号 · .ob-status
      右：#topbar-actions + 返回

  .ob-card                        // ② 主体信息
    .ob-card__head 订单/工单信息
    .ob-card__body > .ob-desc

  .ob-card#panel-materials        // ③ 环节材料（无则隐藏整卡）
    .ob-card__head 环节材料
    .ob-card__body
      .ob-mat-block* …

  .ob-card                        // ④ 全程日志
    .ob-card__head 全程日志
    .ob-card__body--flush > table   // 独占一张列表卡可用 flush；Tab 内嵌表见 detail-page，必须留边
```

---

## 状态 → 顶栏操作（用配置表，禁止散落 if）

在 Spec / 页内注释维护一张表，JS 按 `status` 渲染按钮：

| 状态示例 | 顶栏操作 |
| --- | --- |
| 待接单 / 待领取 | 确认接单、拒绝 |
| 处理中 / 待履约 | 上传材料、标记完成 |
| 待审核 | 通过、驳回 |
| 已完成 / 已关闭 | 无主操作（或「补充材料」） |
| 已拒绝 | 无主操作 |

角色不同（服务商 / 企业 / 监管）→ **同一骨架，裁剪 actions / 字段 / 材料可见性**。

---

## 主体信息

- `.ob-desc` 多列（上标签下内容）：关联对象、联系人、时间、金额等；字段少可用 `--2` 
- 当前状态说明可用全宽一行  
- 关联实体可点：打开只读 Modal / 跳转详情（interaction 写清）  

---

## 环节材料块

```html
<div class="ob-mat-block">
  <div class="ob-mat-block__head">
    <strong>履约凭证</strong>
    <span class="ob-mat-block__meta">张三 · 2026-03-01 12:00</span>
  </div>
  <div class="ob-mat-block__body">
    <!-- 附件列表或说明文本；上传控件见 controls/upload -->
  </div>
</div>
```

| 规则 | 说明 |
| --- | --- |
| 多块 | 块之间用顶部分隔线（kit `.ob-mat-block`） |
| 空 | `#panel-materials` 整卡 `display:none` 或不上 DOM |
| 查看 | 日志「查看」打开只读材料 Modal，复用同一 HTML |

---

## 全程日志表

| 列 | 说明 |
| --- | --- |
| 序号 | |
| 操作节点 | 提交 / 接单 / 上传 / 核销… |
| 操作人 / 端 | |
| 操作时间 | |
| 备注 | 可空 |
| 材料 | `.ob-link`「查看」 |

规范见 [data-table](../data-table.md)；操作列勿用实心按钮。

---

## 弹窗清单

| 场景 | 形态 |
| --- | --- |
| 确认接单 / 通过 | Modal 确认文案 + 双按钮 |
| 拒绝 / 驳回 | Modal + 理由 `textarea`（可用 `--wide`） |
| 上传 / 补充材料 | Modal/Drawer + upload 控件 |
| 查看材料 | 只读 Modal |
| 关联实体 | 只读 Modal 或跳转 |

禁止 `alert`/`confirm`。

---

## proto-spec（MUST）

在本页扁平 Spec（`proto-spec/<page-id>.md`）的状态转换表中维护，例如：

```yaml
# 示例：状态机驱动
states:
  - id: pending_accept
    actions: [accept, reject]
    materials: false
  - id: in_fulfillment
    actions: [upload_material]
    materials: true
```

interaction 写清每个 action 的校验与成功后状态跳转。

---

## 禁止

- 按状态复制多份整页 HTML（应用同一页 + 配置驱动）  
- 材料与日志混在一个无标题长滚动区  
- 把发布类分区表单塞进本模式  

## Checklist

1. 状态 → 操作配置表  
2. 多卡：信息 / 材料 / 日志  
3. 材料空态隐藏  
4. 确认/驳回/上传走 overlay  
5. 角色裁剪写进 Spec  

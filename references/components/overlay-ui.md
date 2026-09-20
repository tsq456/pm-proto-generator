# 弹窗与抽屉（Overlay UI）

骨架见 [form-in-modal](../layouts/form-in-modal.md)、[form-in-drawer](../layouts/form-in-drawer.md)。开合用 `.is-open` + 少量原生 JS。

**何时用 Modal / Drawer / 整页？** 选型见 [form-carrier.md](../form-carrier.md)（本文件只写怎么画）。

## 何时使用

| 形态 | 适用 |
| --- | --- |
| **Modal** | 确认、≤8 字段表单、短详情 |
| **Drawer** | 8–15 字段编辑、侧滑详情（保留列表上下文） |
| **Toast** | 操作成功/失败等非阻断轻提示（`.ob-toast` / `ObToast`） |
| **页内 Alert** | 页面级常驻说明、表单顶部错误汇总（`.ob-alert`） |

**不要**用 `window.alert` / `confirm`；**不要**无遮罩浮层；**不要**手写另一套 `position:fixed` 遮罩样式；**不要**用页内 `.ob-alert` 冒充 Toast。

---

## Modal

```html
<div class="ob-mask is-open" id="demoMask">
  <div class="ob-modal is-open" role="dialog" aria-modal="true">
    <div class="ob-modal__head">
      <strong class="ob-modal__title">标题</strong>
      <button type="button" class="ob-modal__close" aria-label="关闭"></button>
    </div>
    <div class="ob-modal__body">…</div>
    <div class="ob-modal__foot">
      <button type="button" class="ob-btn ob-btn--default">取消</button>
      <button type="button" class="ob-btn ob-btn--primary">确定</button>
    </div>
  </div>
</div>
```

| 属性 | 值 |
| --- | --- |
| 遮罩 | `.ob-mask`，`rgba(19, 32, 57, 0.45)`，`z-index: 1000` |
| 面板 | 居中，默认宽 `min(440px, calc(100% - 32px))`，圆角 `--ob-radius-lg` |
| 头 | flex：标题左、**X 图标**靠最右（空按钮 `.ob-modal__close`，`aria-label="关闭"`；图标由 CSS mask 绘制）；**禁止**「关闭」文本按钮，也禁止把 × 当可见文字写在按钮里 |
| 身 | 水平 `20px` |
| 底 | 右对齐按钮，`gap: 8px`；主按钮在右 |
| 打开 | mask + modal 同时 `.is-open` |

| 修饰 | 宽度 | 用途 |
| --- | --- | --- |
| （默认） | 440px | 确认框、短表单 |
| `.ob-modal--wide` | 720px | 档案双列编辑、驳回+理由 |
| `.ob-modal--xl` | 900px | 宽详情对照 |

确认框可仅 body 一段文案 + 双按钮。档案编辑见 [biz-page/profile-edit-modal](./biz-page/profile-edit-modal.md)。

---

## Drawer

```html
<div class="ob-mask is-open">
  <aside class="ob-drawer is-open">
    <div class="ob-drawer__head">
      <div class="ob-drawer__title">标题</div>
      <button type="button" class="ob-drawer__close" aria-label="关闭"></button>
    </div>
    <div class="ob-drawer__body">…表单或 .ob-desc…</div>
    <div class="ob-drawer__foot">取消 / 保存</div>
  </aside>
</div>
```

| 属性 | 值 |
| --- | --- |
| 位置 | 右侧固定，宽 `min(480px, 100%)`，`z-index: 1001` |
| 头/底 | 分隔线；底右对齐按钮 |
| 身 | `padding: 20px`，可滚动 |
| 只读详情 | 可省略 `__foot` |

Drawer body 内若放 Filter：遵守 filter 定位 MUST（滚动只在表区域）。

---

## 轻提示（Toast）

对齐正式实现的 Message：顶栏下方居中浮层，自动消失。引入 `controls.js` 后调用：

```js
ObToast('已标记为已框选');                 // 默认 info
ObToast('已保存', { type: 'success' });
ObToast('请填写名称', { type: 'error' });
```

样式：`.ob-toast-host` + `.ob-toast`（可选 `--success` / `--warning` / `--error`）。  
页内常驻说明仍用 `.ob-alert`；Runtime 旁路层用 `ps-toast`，勿混用 class。

阻断确认仍用 Modal。

---

## 按钮与加载

| 场景 | 做法 |
| --- | --- |
| 主操作 | `.ob-btn--primary` 在脚部最右 |
| 次操作 | `.ob-btn--default` 在主按钮左 |
| 提交中 | 主按钮 `disabled` +「提交中…」 |
| 危险确认 | 主按钮可用 `--danger`，文案明确后果 |

---

## 禁止

- Modal 内多步向导（改整页 form-page）
- 遮罩与面板只有一个带 `.is-open`
- 与 ProtoSpec Runtime 抽屉抢同一套 class（业务用 `ob-*`，说明层用 `ps-*`）
- 标题旁用「关闭」文本按钮（须用空的 `.ob-modal__close` / `.ob-drawer__close`，X 由 CSS 画，按钮内不写字）

## Checklist

1. mask + modal/drawer 成对 `.is-open`  
2. 脚部主按钮在右  
3. 禁止原生 alert/confirm  
4. 操作反馈用 `ObToast`；页内常驻说明用 `.ob-alert`；阻断用 Modal  
5. 关闭是空的 `.ob-modal__close` / `.ob-drawer__close`（X 图标），不是「关闭」二字  

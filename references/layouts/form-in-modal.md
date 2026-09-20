# 弹窗表单（Form in Modal）

> 本文为上游未指定时的 kit 默认表现。已确认页面 Spec 的布局、列序、字段、交互与能力边界优先；不据此新增业务能力。

对齐官方：`ob-design template form-in-modal` · Form + Modal。

**组件级细则**：[overlay-ui](../components/overlay-ui.md)（遮罩、尺寸、按钮、禁止 alert）。

**选型**：[form-carrier.md](../form-carrier.md)（何时 Modal vs Drawer vs 整页）。

## 适用

- 字段少（约 ≤ 8）、一次提交完成的新建/编辑
- 关键词：弹窗、Modal、轻量表单

## 区块结构

```
触发按钮（列表页 CTA 或行内操作）
└─ .ob-mask.is-open
   └─ .ob-modal.is-open
      ├─ __head 标题
      ├─ __body 表单字段
      └─ __foot 取消 / 确定
```

## HTML 骨架

```html
<!-- 触发 -->
<button type="button" class="ob-btn ob-btn--primary" id="openCreate">新建租户</button>

<div class="ob-mask is-open" id="createMask">
  <div class="ob-modal is-open" role="dialog" aria-modal="true">
    <div class="ob-modal__head">
      <strong class="ob-modal__title">新建租户</strong>
      <button type="button" class="ob-modal__close" id="closeCreate" aria-label="关闭"></button>
    </div>
    <div class="ob-modal__body">
      <div class="ob-stack">
        <div class="ob-field">
          <label class="ob-field__label"><span class="req">*</span>租户名</label>
          <input class="ob-input" placeholder="请输入" />
        </div>
        <div class="ob-field">
          <label class="ob-field__label">备注</label>
          <textarea class="ob-textarea" placeholder="可选"></textarea>
          <div class="ob-field__hint">最多 200 字</div>
        </div>
      </div>
    </div>
    <div class="ob-modal__foot">
      <button type="button" class="ob-btn ob-btn--default">取消</button>
      <button type="button" class="ob-btn ob-btn--primary">确定</button>
    </div>
  </div>
</div>
```

演示关闭态时去掉 `.is-open`；用原生 JS 切换即可。

## 约束

- 必填标 `*`；校验失败说明写在交互文档或字段 hint
- 提交中状态：确定按钮可 `disabled` 并改文案「提交中…」（对齐 confirmLoading）
- 字段多或需对照列表上下文 → 改用 [form-in-drawer.md](./form-in-drawer.md) 或 [form-page.md](./form-page.md)

## 禁止

- 弹窗内再嵌复杂多步向导（应整页或分步页）
- 无遮罩直接浮层

## 正式实现对照

`Modal` + `Form`；`onOk` → `form.submit()`；`confirmLoading`

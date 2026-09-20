# 抽屉表单 / 抽屉详情

对齐官方组合：Form + Drawer、Descriptions + Drawer（见 oceanbase-design `09-combo`）。

**组件级细则**：[overlay-ui](../components/overlay-ui.md)（Drawer 尺寸、只读无脚、与 Modal 选型）。

**选型**：[form-carrier.md](../form-carrier.md)（何时 Modal vs Drawer vs 整页）。

## 适用

- 中等复杂度新建/编辑（约 8–15 字段），需保留列表上下文
- 侧滑只读详情
- 关键词：抽屉、Drawer、侧栏编辑

## 区块结构

```
.ob-mask.is-open
└─ .ob-drawer.is-open
   ├─ __head 标题
   ├─ __body 表单 或 .ob-desc
   └─ __foot 取消 / 确定（只读详情可省略）
```

## HTML 骨架：编辑抽屉

```html
<div class="ob-mask is-open">
  <aside class="ob-drawer is-open" aria-label="编辑租户">
    <div class="ob-drawer__head">
      <div class="ob-drawer__title">编辑租户</div>
      <button type="button" class="ob-drawer__close" aria-label="关闭"></button>
    </div>
    <div class="ob-drawer__body">
      <div class="ob-stack">
        <div class="ob-field">
          <label class="ob-field__label"><span class="req">*</span>租户名</label>
          <input class="ob-input" value="prod-tenant-01" />
        </div>
        <div class="ob-field">
          <label class="ob-field__label">状态</label>
          <select class="ob-select">
            <option>运行中</option>
            <option>已停止</option>
          </select>
        </div>
        <div class="ob-field">
          <label class="ob-field__label">备注</label>
          <textarea class="ob-textarea"></textarea>
        </div>
      </div>
    </div>
    <div class="ob-drawer__foot">
      <button type="button" class="ob-btn ob-btn--default">取消</button>
      <button type="button" class="ob-btn ob-btn--primary">保存</button>
    </div>
  </aside>
</div>
```

## HTML 骨架：只读详情抽屉

```html
<div class="ob-mask is-open">
  <aside class="ob-drawer is-open">
    <div class="ob-drawer__head">
      <div class="ob-drawer__title">租户详情</div>
      <button type="button" class="ob-drawer__close" aria-label="关闭"></button>
    </div>
    <div class="ob-drawer__body">
      <dl class="ob-desc">
        <div class="ob-desc__item">
          <dt>租户名</dt>
          <dd>prod-tenant-01</dd>
        </div>
        <div class="ob-desc__item">
          <dt>状态</dt>
          <dd>运行中</dd>
        </div>
      </dl>
    </div>
    <!-- 无 __foot：对齐 footer={null} -->
  </aside>
</div>
```

## 约束

- 抽屉从右侧滑出；默认演示可用 `.is-open`，交互说明写清打开/关闭
- 单列用 `.ob-stack`，宽度默认 480px。双列用 `.ob-form-grid-2`，并加 `.ob-drawer--wide`（720px）。判定见 [form-carrier.md](../form-carrier.md)「抽屉单列还是双列」
- 抽屉最多两列。备注、上传、子表、分区标题用 `.ob-field--full` 占满一行
- 编辑抽屉脚部主按钮一个即可；次要链接可放在脚部左侧（对应 footerExtra）
- 分区小标题（如「关联资产」）的新增按钮放在标题行最右侧（`.ob-field__head`），不要放在子表下方
- 超长表单、三列需求优先 [form-page.md](./form-page.md)

## 正式实现对照

`Drawer` + `Form` / `Descriptions`；提交用 `confirmLoading`

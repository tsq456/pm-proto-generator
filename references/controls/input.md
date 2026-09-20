# 输入 / 选择 / 多行

对齐官方 Input（含 prefix / suffix）与 Select 空态。视觉在 `kits/ob-static/components.css`。

## 占位文案（MUST）

无特殊需求时：

| 控件 | placeholder / 空态 |
| --- | --- |
| `.ob-input` / `.ob-textarea` | `请输入` |
| `.ob-select` | 首项 `<option value="">请选择</option>`（未选时字色同 placeholder） |

不要把单位、币种、示例人名写进 placeholder。

| 允许偏离默认 | 写法 |
| --- | --- |
| 筛选关键词要交代检索范围 | `地块名称/编码` |
| 填写格式约束，标签说不清 | placeholder 写约束，或放 `.ob-field__hint` |
| 已有业务默认值 | 显示该值，不显示「请选择」 |

校验失败句仍写具体字段（如「请输入园区名称」），与占位文案分开。见 `references/copywriting.md`。

## 前缀和后缀

单位、币种、框内图标用 **affix**，放在边框内侧（不是 Input.addon 外挂块）。

```html
<div class="ob-field">
  <label class="ob-field__label">参考租金</label>
  <div class="ob-input-affix">
    <span class="ob-input-affix__prefix">¥</span>
    <input class="ob-input" placeholder="请输入" />
    <span class="ob-input-affix__suffix">元/m²/月</span>
  </div>
</div>
```

| 场景 | 前缀 | 后缀 | placeholder |
| --- | --- | --- | --- |
| 金额 | `¥` | `元/m²/月`、`万元`、`RMB` 等 | 请输入 |
| 面积 / 期限 | 无 | `m²`、`月`、`天` | 请输入 |
| 账号类图标 | 图标 | 说明 / 显隐图标 | 请输入，或英文产品另有文案 |

- 前缀、后缀都可省略；可同时多个后缀图标
- 只读单位不要再重复进 placeholder

## 禁用

Input、Select、Textarea、affix **都要有禁用态**：灰底 `--ob-color-bg-disabled`、字色 `--ob-color-text-disabled`、无 hover/focus 环、`cursor: not-allowed`。

```html
<input class="ob-input" placeholder="请输入" disabled />
<select class="ob-select" disabled>
  <option value="">请选择</option>
</select>
<textarea class="ob-textarea" placeholder="请输入" disabled></textarea>

<div class="ob-input-affix">
  <span class="ob-input-affix__prefix">¥</span>
  <input class="ob-input" placeholder="请输入" disabled />
  <span class="ob-input-affix__suffix">RMB</span>
</div>
```

也可在控件上加 `.is-disabled`（与 `disabled` 外观一致）。affix 禁用时给内部 input 加 `disabled`，外框随 `:has(:disabled)` 变灰；不要只灰外框却仍可输入。

## 约束

- 金额 / 面积 / 租期等带单位的字段用 affix，禁止 `placeholder="m²"` / `placeholder="元/m²/月"`
- 选择器未选时必须能看见「请选择」，不要用第一项业务枚举冒充空态
- 正式实现：`Input` `prefix` / `suffix`、`disabled`；选择器用 `Select` `placeholder="请选择"`

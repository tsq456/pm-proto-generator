# Checkbox / Radio（P0）

## 何时用

| 控件 | 场景 |
| --- | --- |
| Checkbox | 多选、协议勾选、表格行选 |
| Radio | 互斥单选（枚举项较少时，表单内） |

筛选条里的「状态」等仍优先 [Filter 浮层面板](../component-catalog.md)，不要用一排 Radio 撑满筛选区。

## Checkbox

```html
<label class="ob-check">
  <input type="checkbox" class="ob-check__input" />
  <span class="ob-check__box" aria-hidden="true"></span>
  <span class="ob-check__label">同意协议</span>
</label>
```

选中：`input:checked` 或给 `.ob-check` 加 `.is-checked`（静态演示）。  
禁用：`disabled` 或 `.is-disabled`。  
半选（表格）：`.ob-check.is-indeterminate`。

## Radio

```html
<div class="ob-radio-group" role="radiogroup">
  <label class="ob-radio">
    <input type="radio" class="ob-radio__input" name="cycle" value="daily" checked />
    <span class="ob-radio__dot" aria-hidden="true"></span>
    <span class="ob-radio__label">每天</span>
  </label>
  <label class="ob-radio">
    <input type="radio" class="ob-radio__input" name="cycle" value="weekly" />
    <span class="ob-radio__dot" aria-hidden="true"></span>
    <span class="ob-radio__label">每周</span>
  </label>
</div>
```

横向默认；纵向加 `.ob-radio-group--vertical`。

## 与 Spec

- `enum` 且选项少、表单内互斥 → Radio  
- `array` + 枚举选项 → Checkbox 组  
- `boolean` 协议类 → Checkbox；开关类 → [Switch](./switch.md)

## 禁止

- 无 `ob-check` / `ob-radio` 包装的系统默认控件作为主视觉  
- 用 Radio 模拟 Switch

# Switch（P0）

## 何时用

- 设置项、列表行内「启用/停用」等**二元开关**
- Spec `type: boolean` 且语义是开/关（非「是否同意协议」勾选）

**不要**用 Switch 做三态；**不要**用原生 checkbox 裸奔充当开关。

## 骨架

```html
<button
  type="button"
  class="ob-switch"
  role="switch"
  aria-checked="false"
  data-ob-switch
>
  <span class="ob-switch__handle" aria-hidden="true"></span>
</button>
```

开：

```html
<button type="button" class="ob-switch is-checked" role="switch" aria-checked="true" data-ob-switch>
  <span class="ob-switch__handle" aria-hidden="true"></span>
</button>
```

带文案：

```html
<label class="ob-switch-field">
  <button type="button" class="ob-switch is-checked" role="switch" aria-checked="true" data-ob-switch>
    <span class="ob-switch__handle" aria-hidden="true"></span>
  </button>
  <span class="ob-switch-field__text">启用自动生成任务</span>
</label>
```

禁用：根节点加 `.is-disabled` 与 `disabled`（若为 button）。

## 尺寸

- 默认高 22px、宽 44px（对齐 token 观感）
- 紧凑：`.ob-switch--sm`

## 交互

- `controls.js`：点击切换 `.is-checked` 与 `aria-checked`
- 静态演示某一状态时直接写 class，无需 JS

## 与 Spec

| 场景 | 控件 |
| --- | --- |
| `boolean` 开关 | Switch |
| 「我已阅读协议」 | Checkbox（见 [checkbox-radio.md](./checkbox-radio.md)） |

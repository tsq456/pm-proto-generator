# TimePicker（P1）

## 何时用

- 表单「每天 09:00 生成任务」
- 与 DatePicker 组合成 `datetime`

简化即可：**两列滚动（时 / 分）**，不做秒、不做 12 小时制，除非需求写明。

## 骨架

```html
<div class="ob-timepicker" data-ob-timepicker>
  <button type="button" class="ob-timepicker__trigger">
    <span data-ob-time-label>请选择时间</span>
    <span class="ob-datepicker__icon" aria-hidden="true"></span>
  </button>
  <div class="ob-timepicker__panel">
    <div class="ob-timepicker__cols">
      <ul class="ob-timepicker__col" data-ob-time-col="hour">
        <li><button type="button" class="ob-timepicker__cell is-active">09</button></li>
        <li><button type="button" class="ob-timepicker__cell">10</button></li>
      </ul>
      <ul class="ob-timepicker__col" data-ob-time-col="minute">
        <li><button type="button" class="ob-timepicker__cell is-active">00</button></li>
        <li><button type="button" class="ob-timepicker__cell">30</button></li>
      </ul>
    </div>
    <div class="ob-timepicker__foot">
      <button type="button" class="ob-btn ob-btn--primary ob-btn--sm" data-ob-time-ok>确定</button>
    </div>
  </div>
</div>
```

打开：`.is-open`。步长默认 30 分钟可在示意数据里写死。

## 定位

同 DatePicker 浮层规则。

## 与 Spec

`datetime` → Date + Time；仅时间字段可在 description 标明 `time` 语义并用本控件。

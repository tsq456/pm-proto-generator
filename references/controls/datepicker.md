# DatePicker / RangePicker（P0）

## 何时用

| 场景 | 控件 |
| --- | --- |
| 表单「生效日期」 | `.ob-datepicker` 单日 |
| 筛选「创建时间」区间 | `.ob-datepicker.ob-datepicker--range` |
| 旁路更新记录「有记录标点」 | 同套日历；触发器可用工具栏按钮，面板加 `.ob-calendar--marked` |

**禁止**：`input[type=date]` 作为主 UI；禁止另造紫色/圆角风格日历。

## 单日骨架

```html
<div class="ob-datepicker" data-ob-datepicker>
  <button type="button" class="ob-datepicker__trigger">
    <span data-ob-date-label>请选择日期</span>
    <span class="ob-datepicker__icon" aria-hidden="true"></span>
  </button>
  <div class="ob-datepicker__panel" hidden>
    <div class="ob-calendar" data-ob-calendar>
      <!-- 由 controls.js 填充，或静态示意下方结构 -->
    </div>
  </div>
</div>
```

静态示意（无 JS 演示某一状态时，给根节点加 `.is-open`，并手写日历）：

```html
<div class="ob-datepicker is-open">
  <button type="button" class="ob-datepicker__trigger">
    <span>2026-09-17</span>
    <span class="ob-datepicker__icon" aria-hidden="true"></span>
  </button>
  <div class="ob-datepicker__panel">
    <div class="ob-calendar">
      <div class="ob-calendar__head">
        <button type="button" class="ob-calendar__nav" data-cal-prev>‹</button>
        <div class="ob-calendar__title">2026年9月</div>
        <button type="button" class="ob-calendar__nav" data-cal-next>›</button>
      </div>
      <div class="ob-calendar__week">
        <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
      </div>
      <div class="ob-calendar__grid">
        <button type="button" class="ob-calendar__day is-empty"></button>
        <!-- … -->
        <button type="button" class="ob-calendar__day has-mark is-selected">17<i class="ob-calendar__dot"></i></button>
      </div>
      <div class="ob-calendar__foot">
        <button type="button" class="ob-calendar__link" data-cal-clear>清除</button>
        <button type="button" class="ob-calendar__link" data-cal-today>今天</button>
      </div>
    </div>
  </div>
</div>
```

## 区间骨架

```html
<div class="ob-datepicker ob-datepicker--range" data-ob-datepicker="range">
  <button type="button" class="ob-datepicker__trigger">
    <span data-ob-date-label>开始日期</span>
    <span class="ob-datepicker__sep">→</span>
    <span data-ob-date-label-end>结束日期</span>
    <span class="ob-datepicker__icon" aria-hidden="true"></span>
  </button>
  <div class="ob-datepicker__panel">
    <div class="ob-calendar" data-ob-calendar></div>
  </div>
</div>
```

原型交互：第一次点选开始、第二次点选结束即可；不必实现复杂 hover 范围预览。

## 日历单元格 class

| class | 含义 |
| --- | --- |
| `.ob-calendar__day` | 日期格 |
| `.is-empty` | 占位 |
| `.is-muted` | 无数据/不可选（更新记录标点模式） |
| `.has-mark` | 有记录，显示 `.ob-calendar__dot` |
| `.is-selected` | 选中 |
| `.is-in-range` | 区间内（Range 用） |
| `.is-range-start` / `.is-range-end` | 区间端点 |

## 定位 MUST

- `.ob-datepicker` = `position: relative`
- `.ob-datepicker__panel` = `absolute; top: calc(100% + 4px); left: 0; z-index: 40`
- 父级滚动拆分规则见 [README.md](./README.md)
- 抽屉右侧贴边：该实例加 `.ob-datepicker--align-right`（`right: 0; left: auto`）

## 与 Spec

- `type: date` → 本控件  
- `type: datetime` → 本控件 + [timepicker.md](./timepicker.md)，或两个 field  

## 旁路对齐

更新记录日期筛选应使用 **同一套 `.ob-calendar` 视觉**（允许 Runtime 包一层 `ps-*` 触发器，但日格 class 优先 `ob-calendar__*`）。

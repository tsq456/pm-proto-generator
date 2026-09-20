# 数值范围选择器

查询区里的数值区间（面积、租金、金额、租期等）。**不是**把两个输入框铺在筛选行上。

和枚举筛选同一套触发器：默认只显示字段名和下拉箭头；点开浮层再填最小、最大；点「确定」后，范围写回触发器。

## 何时使用

列表筛选命中 `references/components/filter-form.md`「筛什么」里的数值区间时，**必须**用本控件。

禁止：

- 筛选行上外置标签 +「最小」「最大」两个常显输入框
- 占位写成单位或「最小 / 最大」（占位固定「请输入」）
- 单位另起一行。有单位时放在最小、最大两个输入框内，作为后缀（`.ob-input-affix`）

## 骨架

```html
<div class="ob-filter-item ob-filter-range" data-range-key="landArea" data-range-name="用地面积" data-range-unit="m²">
  <button type="button" class="ob-filter-trigger">
    <span data-filter-label>用地面积</span>
    <span class="ob-filter-trigger__caret" aria-hidden="true"></span>
  </button>
  <div class="ob-filter-panel ob-filter-panel--range">
    <div class="ob-filter-panel__title">用地面积</div>
    <div class="ob-filter-range__body">
      <label class="ob-filter-range__field">
        <span>最小面积</span>
        <div class="ob-input-affix">
          <input class="ob-input" inputmode="decimal" placeholder="请输入" data-range-min="landArea" />
          <span class="ob-input-affix__suffix">m²</span>
        </div>
      </label>
      <span class="ob-filter-range__sep">-</span>
      <label class="ob-filter-range__field">
        <span>最大面积</span>
        <div class="ob-input-affix">
          <input class="ob-input" inputmode="decimal" placeholder="请输入" data-range-max="landArea" />
          <span class="ob-input-affix__suffix">m²</span>
        </div>
      </label>
    </div>
    <div class="ob-filter-panel__footer">
      <button type="button" class="ob-btn ob-btn--text ob-btn--sm" data-range-reset>重置</button>
      <button type="button" class="ob-btn ob-btn--primary ob-btn--sm" data-range-ok>确定</button>
    </div>
  </div>
</div>
```

须引入 `kits/ob-static/filter-dropdown.js`。开合、确定、浮层重置由该脚本处理，不要在页面再写一套。

| 属性 | 含义 |
| --- | --- |
| `data-range-key` | 与 `[data-range-min]` / `[data-range-max]` 相同，页面按它取已生效范围 |
| `data-range-name` | 触发器默认文案，与浮层标题一致 |
| `data-range-unit` | 触发器已选文案用的单位，如 `m²`、`元`。浮层里同一单位写在两个输入框的后缀，不要另起一行。没有单位就省略 |

浮层字段标题用「最小{度量}」「最大{度量}」：面积是「最小面积 / 最大面积」，租金是「最小租金 / 最大租金」。不要只写「最小」「最大」。

## 状态

| 状态 | 表现 |
| --- | --- |
| 未选 | 触发器只有字段名，如「占地面积」 |
| 打开 | `.ob-filter-item.is-open`，浮层在触发器下方 |
| 两侧都填，点确定 | 触发器改为「占地面积 500~2000m²」 |
| 只填一侧，点确定 | 「占地面积 ≥500m²」或「占地面积 ≤2000m²」 |
| 浮层「重置」 | 只清这一组最小/最大，触发器回到字段名；不带动其他筛选项 |
| 点浮层外或 Esc，未点确定 | 丢弃未确定的输入，触发器保持上次确定的结果 |
| 筛选条「重置」 | 清掉全部条件，包括已确定的范围 |

最小大于最大时，确定时对调后再写入。

确定后的值写在触发器容器上：`data-applied-min`、`data-applied-max`。不要读浮层里尚未确定的输入框。确定或浮层重置会冒泡 `ob-filter-range`，只表示范围已写回触发器，页面不要据此刷新列表。点筛选条「查询」时再把这两个属性抄进已生效条件；列表过滤读抄下来的值，不要在每次渲染时直接读触发器，否则保存、删除会把还没查询的范围算进去。见 `references/components/filter-form.md`「何时刷新列表」。

## 和表单输入的区别

表单里的单个数值仍用 `.ob-input` 或前缀后缀输入（`references/controls/input.md`）。本控件只用于**查询区的区间**。

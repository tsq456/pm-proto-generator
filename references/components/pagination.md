# 分页（Pagination）

> 本文为上游未指定时的 kit 默认表现。已确认页面 Spec 的布局、列序、字段、交互与能力边界优先；不据此新增业务能力。

列表卡底部：`.ob-table-footer` + `.ob-pagination`。

## 何时使用

- 列表主表翻页；详情子表一般**不分页**（行少）或注明「仅展示最近 N 条」

**不要**把分页拆到筛选卡或另一张独立卡；**不要**给页码外的「… / 每页条数」套页码边框（若增加这些元素）。

---

## 结构

```html
<div class="ob-table-footer">
  <span>共 28 条</span>
  <div class="ob-pagination">
    <button type="button" class="is-active">1</button>
    <button type="button">2</button>
    <button type="button">3</button>
  </div>
</div>
```

| 元素 | 规则 |
| --- | --- |
| footer | `flex`，左右分布；`padding: 12px 16px`；描述色 `--ob-color-text-description` |
| 左侧 | 总数文案「共 N 条」（可加当前范围） |
| 右侧 | `.ob-pagination`，`gap: 4px` |
| 页码钮 | `min-width/height: 28px`，边框 `--ob-color-border-default`，圆角 sm |
| 当前页 | `.is-active` → 选中边框色 |
| 禁用 | `disabled` 或降低透明度（首页‹ / 末页›） |

可选（静态演示）：在 pagination 旁加「10 条/页」文案；**不要**做成第二个主按钮。

---

## 对齐

与 [list-page](./list-page.md) 一致：footer 与 flush 表格同卡，水平 padding `16px`，与单元格左右 padding 对齐。

禁止：

```html
<!-- 错误：额外包一层改变右缘 -->
<div style="padding: 16px 0">
  <div class="ob-table-footer">…</div>
</div>
```

---

## 状态

| 状态 | 表现 |
| --- | --- |
| 仅一页 | 仍可显示分页（1 为 active）或隐藏分页仅留总数——同包内统一 |
| 无数据 | 与空态一起：可隐藏分页或禁用 |


## 勾选后的底栏

未勾选时，左侧仍是「共 N 条」，右侧是分页。

勾选至少一行后，左侧整段换成：

1. 「已选 N 个对象」
2. 文字链「取消」：清空当前勾选
3. 本页批量按钮（如「启用」「停用」），次要按钮横排

不要「展开」。右侧分页不动；「共 N 条」改到分页左侧。取消全部勾选后，底栏回到只有左侧「共 N 条」。

详情内嵌表默认无复选（`.ob-table--no-select`）。仅当该子表有批量操作时才开复选；勾选后在表下出现已选栏（已选数量、取消、以及该表自己的批量按钮）；未勾选时不占位。批量按钮不要留在表格上方。详情子表的「新增」仍用 `.ob-panel-toolbar`，那不是列表页的主按钮。

```html
<div class="ob-table-footer">
  <div class="ob-table-footer__lead">
    <span class="ob-table-footer__total">共 28 条</span>
    <div class="ob-table-footer__batch">
      <span class="ob-table-footer__picked">已选 <span data-table-picked>2</span> 个对象</span>
      <button type="button" class="ob-link" data-table-clear>取消</button>
      <button type="button" class="ob-btn ob-btn--default ob-btn--sm" data-table-batch>启用</button>
      <button type="button" class="ob-btn ob-btn--default ob-btn--sm" data-table-batch>停用</button>
    </div>
  </div>
  <div class="ob-table-footer__end">
    <span class="ob-table-footer__total-side" data-table-total-side>共 28 条</span>
    <div class="ob-pagination">…</div>
  </div>
</div>
```

## Checklist

1. footer 在列表卡 flush 体内、表格下方  
2. 总数在左、页码在右  
3. 当前页 `.is-active`  

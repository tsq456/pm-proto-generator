# 查询筛选区（Filter Form）

列表顶栏筛选；类名 `.ob-filter` + Filter 浮层。定位 MUST 见 [component-catalog](../component-catalog.md)。

## 何时使用

- 列表页「查询条件」卡内（**无**「筛选条件」卡头标题）
- 工具栏轻量筛选（仍用浮层面板，不用原生 select）

**不要**在筛选区定义表格/分页；**不要**手写散落 `min-width`。

---

## 单行筛选（默认）

```html
<div class="ob-filter">
  <input class="ob-input" placeholder="搜索关键字" style="max-width:220px" />
  <div class="ob-filter-item">…trigger + panel…</div>
  <span class="ob-filter__spacer"></span>
  <button type="button" class="ob-btn ob-btn--primary">查询</button>
  <button type="button" class="ob-btn ob-btn--default">重置</button>
</div>
```

须引入 `kits/ob-static/filter-dropdown.js`。

| 属性 | 值 |
| --- | --- |
| 行布局 | `flex` + `wrap`，`gap: 8px`（`--ob-space-200`），垂直居中 |
| 关键字框宽 | `220px`（`.ob-filter .ob-input`） |
| Trigger 高 | `32px`，`padding: 0 12px`，圆角 `--ob-radius-sm` |
| 查询/重置 | `__spacer` 推到右侧；主按钮「查询」、次按钮「重置」 |

## 何时刷新列表（MUST）

查询区里的改动只更新控件，**不刷新列表**。点筛选条「查询」后，才按当前控件重新过滤。点「重置」清空全部条件并刷新。

包括以下提交，都不能当场刷新：

- 输入或改关键字
- 点选或勾选枚举筛选项（多选点「确定」只写回触发器）
- 数值范围浮层点「确定」，或浮层里的「重置」
- 空间级联选中节点（所在位置等）

新增、编辑、删除后的列表刷新，用的是**上一次点「查询」或「重置」之后**的条件，不要把还没查询的控件值算进去。

关键字、枚举、范围、空间级联都在点「查询」时读取。不要在 `input`、选项点击、`ob-filter-range`、级联选中时调用列表渲染。

卡内仅含筛选时：`.ob-card__body > .ob-filter:last-child` 不应再叠多余底边距（kit 已收敛）。

---

## 多条件（仍单行换行）

条件 > 4 个时允许 wrap 到第二行；按钮仍靠右（`__spacer` 在字段与按钮之间）。  
**不要**改成表单式 `.ob-form-row` 充当列表筛选（那是整页表单）。

数值区间**必须**用数值范围选择器，见 [number-range.md](../controls/number-range.md)：触发器与枚举筛选同形，最小/最大在浮层里，点「确定」后写回触发器。禁止把两个输入框直接铺在筛选行。

---

## 筛什么（MUST）

先看列表列和本页主任务，再决定筛选项。默认带名称/编码关键词。其余按下面判断，命中就放进筛选区，不要只出现在表格里。

| 判断 | 放进筛选 | 例子 |
| --- | --- | --- |
| 枚举且会决定能不能做下一步 | **必须** | 状态、招商开关、经营方式、启用/停用 |
| 数值，用户会按区间找 | **必须**用数值范围选择器 | 用地面积、建筑面积、计租面积、租金 |
| 层级归属，列表里要按上级缩小 | 建议 | 所属园区、所属楼栋 |
| 只是备注、附件、内部流水号 | 不放 | 备注、创建人（除非检索是主任务） |
| 和关键词重复 | 不另做一列筛选 | 名称已在关键词里 |

同一实体多页列表，这类字段用词保持一致（都叫「招商开关」，不要一页叫「是否招商」）。


## 枚举选择器（默认多选）

查询区里的枚举选择器默认多选，类名 `.ob-filter-multi`。`filter-dropdown.js` 会给 `.ob-filter` 里的枚举项自动加上这个类。选项左侧是复选框，底部是「重置」和「确定」。勾选只改浮层，点「确定」才写回触发器；点筛选条「查询」后列表才按所选值过滤，命中任一即可。未选任何项表示不限。触发器未选时显示字段名，选中后显示「字段名：值1、值2」。

仅当规格写明「仅支持单选」时，给该项加 `data-filter-single`，保持点选即关、只留一个值。

表单里的短枚举（经营方式、证书类型、租期单位等）仍用 `.ob-enum-select`，单选，不要套 `.ob-filter-multi`。


---

## Filter 浮层状态

| 状态 | 类名 / 表现 |
| --- | --- |
| 关闭 | panel `display: none` |
| 打开 | `.ob-filter-item.is-open`，panel 显示，trigger 焦边 + 浅环 |
| 选项选中 | `.ob-filter-panel__item.is-active` |
| hover 项 | `--ob-color-bg-hover` |

面板：`top: calc(100% + 4px)`，`z-index: 40`，相对 `.ob-filter-item`。

### 定位 MUST（防裁切）

1. 祖先勿对「trigger+panel」整块 `overflow: auto|hidden`  
2. 滚动只发生在表格区，筛选行 `overflow: visible`  
3. 结构：`.ob-filter-item` > trigger + panel（panel 为直接子节点）  
4. Runtime 旁路点击须 `stopPropagation`，避免与 `filter-dropdown.js` 双开  

---

## `.ob-select` vs Filter

| 场景 | 用 |
| --- | --- |
| 列表 / 工具栏筛选 | `.ob-filter-item` 浮层 |
| 表单字段「请选择」 | `.ob-select` |
| 日期 / 级联等 | `references/controls/` |

---

## 禁止

- 列表筛选条里的原生 `<select class="ob-select">`
- 导出按钮放在筛选区
- 每页手写不同控件宽度（改业务文案即可；宽用 220 / trigger 默认）

## Checklist

1. 浮层面板完整结构 + `filter-dropdown.js`  
2. 查询/重置右对齐  
3. 查询区改关键字、枚举、数值范围或空间级联后不刷新列表，要点「查询」才生效（见「何时刷新列表」）  
4. 无 overflow 裁切祖先  
5. 查询区枚举默认 `.ob-filter-multi`；仅规格写明「仅支持单选」时用 `data-filter-single`。表单 `.ob-enum-select` 保持单选  

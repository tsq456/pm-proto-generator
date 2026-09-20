# 数据表格（Data Table）

> 本文为上游未指定时的 kit 默认表现。已确认页面 Spec 的布局、列序、字段、交互与能力边界优先；不据此新增业务能力。

列表卡中部表格；容器 `.ob-table-wrap` > `.ob-table`。

## 何时使用

- 列表主表、详情内子表（日志 / 明细）

**不要**去掉 wrap 导致宽表撑破；**不要**操作列用实心主按钮。

---

## 结构

```html
<div class="ob-table-wrap">
  <table class="ob-table">
    <thead>
      <tr>
        <th>名称</th>
        <th>状态</th>
        <th class="ob-table__actions">操作</th>
      </tr>
    </thead>
    <tbody>…</tbody>
  </table>
</div>
```

列表页：包在 `.ob-card__body--flush` 内（贴边）。  
详情子表：**必须**放在普通 `.ob-card__body`（有内边距），**禁止** `--flush`。`.ob-table-wrap` 自带描边与圆角，与详情 `.ob-desc` 对齐。

表上操作（新增图纸、新增抵押、前往某管理等）用 `.ob-panel-toolbar`，在 wrap **上方左对齐**；不要右对齐、不要放页头。

---

## 设计令牌

| 属性 | 值 |
| --- | --- |
| 单元格 padding | `12px 16px` |
| 表头背景 | `--ob-color-bg-primary` |
| 表头字色 | `--ob-color-text-label`，`font-weight: 600` |
| 行分隔 | `border-bottom: 1px solid var(--ob-color-divider)` |
| 行 hover | `--ob-color-bg-hover` |
| 字号 | `--ob-font-body1` |
| 对齐 | 默认左对齐；数字列可右对齐（在页内约定，勿混用无说明） |
| 横向滚动 | `.ob-table-wrap { overflow: auto }`；列多时表可 `min-width` |

---

## 操作列

- 固定**最后一列**，表头「操作」，`th` 与 `td` 都加 `.ob-table__actions`
- 单元格：`td.ob-table__actions`，内为多个 `.ob-link`（相邻间距 8px）
- **禁止**给该 `td` 设置 `display:flex`（会破坏 `table-cell`，导致行横线错位）
- 横向滚动且列放不下时，操作列贴右；左侧用**一条**整列阴影（`.ob-table-pin`），不要逐行 `box-shadow`
- 列能完整放下时不显示这条阴影
- 多个操作用间距分隔，**不要**用 `|` 竖线
- 破坏性操作（删除/下线）：仍用 link，交互说明写确认（[overlay-ui](./overlay-ui.md)）

```html
<td class="ob-table__actions">
  <button type="button" class="ob-link">详情</button>
  <button type="button" class="ob-link">编辑</button>
</td>
```

---

## 状态与标签

不要按 `enum` / `boolean` 机械上 Tag。先按 [table-field-visual.md](./table-field-visual.md) 判断是普通属性、分类属性还是状态。该规范是**全站**的，详情描述表与内嵌子表同样适用。

| 语义 | 类名 |
| --- | --- |
| 状态（圆点 + 文字） | `.ob-status` + `--stopped` 灰 / `--processing` 蓝 / `--creating` 橙 / `--running` 或 `--success` 绿 / `--error` 红 |
| 分类 Tag（需要扫读时） | `.ob-tag`，默认同一种浅色（`--default` 或 `--info`） |
| 普通属性、低强调枚举 | 纯文本，不加 Tag、不加圆点 |

同一列风格统一。状态列不要改成彩色 Tag。

---

## 字号与详情页关系

- 列表主表：body1  
- 详情页内嵌表：保持与列表一致或略紧；**不要**大于详情 `.ob-desc` 正文字号造成头重脚轻  

---

## 树形表

同一实体存在父子、且子级还可再挂子级时（如园区 → 子园区 → 孙园区），用 `.ob-table.ob-table--tree`。**不要**另做一套缩进样式，**不要**把层级只写在「所属上级」文本里代替展开。

- 展开箭头在**复选框左侧**，不单独占一列表头，也不再放进名称列。表头用叶子占位，与首行复选框对齐
- 有子级：`<button type="button" class="ob-table-tree__switcher" aria-expanded="true|false" aria-label="收起|展开">`
- 叶子：同一按钮加 `.is-leaf`（占位对齐，不可点）
- 名称容器：`.ob-table-tree__name`。缩进打在 `.ob-table-select__lead` 的 `--ob-tree-depth`（0 起），每层 20px，不要再缩进名称列。编号按「名称与编号同列」叠在名称下
- 行：`data-tree-id`、`data-tree-parent`（根节点 parent 为空）
- 收起后后代行加 `.is-tree-hidden`（`display: none`）。点箭头由 `controls.js` 切换，业务页只负责按层级输出行
- 筛选命中子节点时带上祖先，避免树断掉；条数按当前列出的节点计
- 默认展开有子级的节点，方便看到层级；分页不要把父子拆到不同页（数据量大时按根节点分页，子行跟父走）

```html
<table class="ob-table ob-table--tree">
  <thead>
    <tr>
      <th class="ob-table__select">
        <span class="ob-table-select__lead">
          <span class="ob-table-tree__switcher is-leaf" aria-hidden="true"></span>
          <label class="ob-check"><input type="checkbox" class="ob-check__input" data-table-check-all /><span class="ob-check__box"></span></label>
        </span>
      </th>
    </tr>
  </thead>
  <tbody>
    <tr data-tree-id="park-001" data-tree-parent="">
      <td class="ob-table__select">
        <span class="ob-table-select__lead" style="--ob-tree-depth:0">
          <button type="button" class="ob-table-tree__switcher" aria-expanded="true" aria-label="收起"></button>
          <label class="ob-check"><input type="checkbox" class="ob-check__input" data-table-check-row /><span class="ob-check__box"></span></label>
        </span>
      </td>
      <td>
        <div class="ob-table-tree__name"><span>临空产业园</span></div>
      </td>
    </tr>
    <tr data-tree-id="park-002" data-tree-parent="park-001">
      <td class="ob-table__select">
        <span class="ob-table-select__lead" style="--ob-tree-depth:1">
          <button type="button" class="ob-table-tree__switcher is-leaf" tabindex="-1" aria-hidden="true"></button>
          <label class="ob-check"><input type="checkbox" class="ob-check__input" data-table-check-row /><span class="ob-check__box"></span></label>
        </span>
      </td>
      <td>
        <div class="ob-table-tree__name"><span>临空产业园-子园区</span></div>
      </td>
    </tr>
  </tbody>
</table>
```

状态、分类、操作列规则与普通表相同。

---

## 名称与编号同列

上游明确要求独立编码列时保留独立列。其余情况下，同一对象既有名称又有编号时，默认合为一列。名称在上，编号用灰字放在名称下方，腾出列宽。合同编号、证书编号这类本身就是主标识、旁边没有名称列的，保持单列，不要硬叠一行。

- 表头仍用名称列的名称，例如「园区名称」「设备名称」，删掉编号列
- 结构：`.ob-table-id` > `.ob-table-id__name` + `.ob-table-id__code`
- 编号颜色 `--ob-color-text-description`，字号 `--ob-font-caption`
- 没有编号，或编号与名称相同，不重复灰字行
- 名称是链接时，链接只包名称，编号仍在下方
- 树表把 `.ob-table-id` 放进 `.ob-table-tree__name`。展开箭头在复选列，不跟名称走
- 详情 `.ob-desc` 仍分字段展示，不套这套叠放
- 筛选仍可按名称和编号匹配，只是不再各占一列

```html
<td>
  <div class="ob-table-id">
    <div class="ob-table-id__name">榕智A01地块</div>
    <div class="ob-table-id__code">PLOT-FZ-HS-A01</div>
  </div>
</td>
```

---

## 单位放哪

同一列单位不变时，单位只写在**表头**，单元格只写数值。表头用全角括号，紧跟字段名：`参考租金（元/月）`、`用地面积（m²）`。不要写成 `参考租金/元/月`，也不要每行再写一遍 `800 元/月`。

空值单元格写「—」，不加单位。

单位会随行变化时，才写进单元格。例如最短租期可以是月或年，表头不能写死一种，单元格写 `12 月` 或 `1 年`。文件大小在 KB、MB 之间变化，也留在单元格。

这只约束 `.ob-table`。详情 `.ob-desc` 没有列头，单位仍跟在数值后面，例如 `800 元/月`。表单里的单位仍用输入框前缀或后缀，不写进表头规则。

---

## 行选择

### 列表主表（默认开启）

明确不做批量操作时，无论列表主表或详情子表，均加 `.ob-table--no-select`（或 `data-table-no-select`），防止自动补复选。其余列表页主表默认最左一列是复选（`.ob-table__select` + `.ob-check`）。表头为全选，不写列名。已经有复选列的表不要再加一列。

可展开表的列序是：展开箭头、复选框、名称及其他列。箭头不占表头；叶子用 `.is-leaf` 占位。勾选行加 `.is-selected`（浅蓝底）。

未勾选时，`.ob-table-footer` 左侧是「共 N 条」。勾选至少一行后，左侧整段换成「已选 N 个对象」、文字链「取消」（清空勾选）、本页批量按钮（如「启用」「停用」，加 `data-table-batch`）。不要「展开」。右侧分页不动，「共 N 条」改到分页左侧。没有批量操作时，只显示已选数量和取消。

`controls.js` 会给还没写复选列的表补上，并切换底栏。新表仍按上面的结构写，不要依赖运行时再补。

### 详情内嵌表（默认关闭）

详情页、详情 Tab、与 `.ob-desc` 同卡的内嵌表，**默认不要复选**，写 `.ob-table--no-select`（或 `data-table-no-select`）。`controls.js` 不会补复选列，也不会造已选底栏。

| 需要复选 | 不要复选（加 `--no-select`） |
| --- | --- |
| 该子表有**批量操作**（勾选后底栏出现批量启用/停用/删除等） | 只读展示：日志、进度流水、关联列表「仅查看」 |
| Spec 明确写「可多选后批量处理」 | 只有行内单条操作（打卡、编辑、查看），无批量 |
| — | 父对象已终态/只读时，子表也不应再勾选 |

判定口诀：**没有批量，就不要复选。** 详情子表的「新增」仍放 `.ob-panel-toolbar`，不要和列表页头的新建混用，也不要用复选列冒充多选能力。

## 禁止

- 操作列 `<button class="ob-btn ob-btn--primary">`
- 无 `.ob-table-wrap` 的宽表
- 每页私有边框色 / 表头色（用 Token）

## Checklist

1. wrap + table  
2. 操作列 link  
3. 状态/标签符合 `table-field-visual.md`，不按 enum 一律 Tag  
4. 列表场景放在 flush 卡内  
5. 详情内嵌表留边 + wrap 描边；表上按钮在 `.ob-panel-toolbar` 左上  
6. 同一列单位不变时只写表头（全角括号），单元格只写数值；单位随行变化才写进单元格
7. 名称与编号同列，编号灰字在名称下，不另开列  
8. 列表主表最左复选；详情内嵌表默认 `--no-select`（仅有批量时才开复选）；树表箭头在复选框左侧；勾选后底栏换成已选数量、取消和批量按钮，不要展开  

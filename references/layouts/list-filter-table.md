# 列表页：筛选 + 表格 + 分页

对齐官方：`ob-design template list-filter-table` · Filter.ResponsiveGroup + Card + Table(innerBordered)。

**组件级细则（间距 / 分区 / 状态 / 禁止）**：

- [list-page](../components/list-page.md)
- [filter-form](../components/filter-form.md)
- [data-table](../components/data-table.md)
- [pagination](../components/pagination.md)

## 适用

- 资源列表、工单列表、策略列表等「查 + 览 + 操作」页
- 关键词：列表、筛选、表格、分页、批量操作

## 区块结构

```
壳层（app-shell）
└─ .ob-content
   ├─ .ob-page-title（仅 h1 + 主 CTA，默认无副文本）
   └─ .ob-stack
      ├─ .ob-card 筛选区（无 head；直接 .ob-filter）
      └─ .ob-card 列表区（无重复页名标题；可选工具按钮 + flush 表格 + 分页）
```

双卡竖排，中间露出内容区灰底（由 `.ob-stack` gap 形成）。

## HTML 骨架

页面需引入 `kits/ob-static/filter-dropdown.js`。筛选条使用 **OB 浮层面板**，不要用原生 `<select>`。数值区间用数值范围选择器（`references/controls/number-range.md`），不要把最小/最大输入直接铺在筛选行。关键字、枚举、数值范围、空间级联改完后不刷新列表，要点「查询」才生效，见 `filter-form.md`「何时刷新列表」。

```html
<main class="ob-content">
  <div class="ob-page-title">
    <div>
      <h1>租户列表</h1>
    </div>
    <div class="ob-page-title__actions">
      <button type="button" class="ob-btn ob-btn--primary">新建租户</button>
    </div>
  </div>

  <div class="ob-stack">
    <section class="ob-card">
      <div class="ob-card__body">
        <div class="ob-filter">
          <input class="ob-input" placeholder="搜索关键字" style="max-width:220px" />

          <div class="ob-filter-item">
            <button type="button" class="ob-filter-trigger">
              <span data-filter-label>状态</span>
              <span class="ob-filter-trigger__caret" aria-hidden="true"></span>
            </button>
            <div class="ob-filter-panel" role="listbox">
              <div class="ob-filter-panel__title">状态</div>
              <div class="ob-filter-panel__list">
                <button type="button" class="ob-filter-panel__item is-active" data-label="状态">全部</button>
                <button type="button" class="ob-filter-panel__item" data-label="已启用">已启用</button>
                <button type="button" class="ob-filter-panel__item" data-label="已停止">已停止</button>
              </div>
            </div>
          </div>

          <span class="ob-filter__spacer"></span>
          <button type="button" class="ob-btn ob-btn--primary">查询</button>
          <button type="button" class="ob-btn ob-btn--default">重置</button>
        </div>
      </div>
    </section>

    <section class="ob-card">
      <div class="ob-card__toolbar">
        <button type="button" class="ob-btn ob-btn--default ob-btn--sm">导出</button>
      </div>
      <div class="ob-card__body ob-card__body--flush">
        <div class="ob-table-wrap">
          <table class="ob-table">
            <thead>
              <tr>
                <th class="ob-table__select"><label class="ob-check"><input type="checkbox" class="ob-check__input" data-table-check-all /><span class="ob-check__box"></span></label></th>
                <th>租户名</th>
                <th>状态</th>
                <th>创建时间</th>
                <th class="ob-table__actions">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="ob-table__select"><label class="ob-check"><input type="checkbox" class="ob-check__input" data-table-check-row /><span class="ob-check__box"></span></label></td>
                <td>prod-tenant-01</td>
                <td><span class="ob-status ob-status--running"><span class="ob-status__dot"></span>运行中</span></td>
                <td>2026-03-01 10:00</td>
                <td class="ob-table__actions">
                  <button type="button" class="ob-link">详情</button>
                  <button type="button" class="ob-link">编辑</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="ob-table-footer">
          <span>共 28 条</span>
          <div class="ob-pagination">
            <button type="button" class="is-active">1</button>
            <button type="button">2</button>
            <button type="button">3</button>
          </div>
        </div>
      </div>
    </section>
  </div>
</main>
```

## 约束（样式评审结论）

- **页头**：默认只有 `h1`，不要副文本 `<p>`（确需说明用 `.ob-page-title__desc`）
- **筛选卡**：不要「筛选条件」标题
- **列表卡**：不要再显示与页头重复的「××列表」标题
- **操作列**：`.ob-table__actions` 打在末列 `th`/`td` 上；横向滚动时贴右悬浮。kit 禁止对该单元格使用 `display:flex`，以免横线错位
- **列表卡描边**：`.ob-card__body--flush` 裁切内层圆角；不要给 `.ob-card` 本身 `overflow: hidden`，否则圆角描边会被裁掉

## 空态 / 加载

- 无数据：表格区用 `.ob-empty`，可带「去新建」主按钮
- 加载：可用一行灰色占位文案或骨架行（勿假称真实请求）

## 约束

- 主新建按钮在 `.ob-page-title__actions`，不要放在筛选卡内，也不要放到表格上方
- 表格默认最左一列复选。勾选后底栏左侧换成已选数量、取消和批量按钮，不要展开。见 [data-table](../components/data-table.md)、[pagination](../components/pagination.md)
- 筛选区必须是独立卡或明确的 `.ob-filter` 区块
- **筛选项用 `.ob-filter-item` 浮层面板**，禁止列表筛选条里的原生 `<select>`
- 表格放在 `.ob-card__body--flush` 内，分页在同一张列表卡底部
- 双卡间距由 `.ob-stack`（16px）承担，露出内容区灰底
- 操作列用 `.ob-link` 或小号按钮，破坏性操作用确认（交互说明中写清）

## 禁止

- 筛选与表格糊成一张大卡且无分区标题（除非用户明确要求单面板）
- 为装饰再套一层卡片
- 用原生下拉冒充 OB Filter 面板
- 分页与表格不同水平内边距容器（破坏右缘对齐）

## 正式实现对照

`PageContainer` + `Filter.ResponsiveGroup` + `Card bodyStyle={{ padding: 0 }}` + `Table innerBordered`

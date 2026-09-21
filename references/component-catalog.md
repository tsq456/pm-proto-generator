# 组件目录（`ob-*`）

优先复用下列基础组件。按 [逐页实现选型](page-implementation.md)检查实际能力；不足时依次组合、适配或新增最小实现。单页需要不自动触发仓库 kit 扩展。

## 壳层

**单应用**（默认 `shell: app-shell`）：

```html
<div class="ob-app">
  <div class="ob-layout">
    <aside class="ob-sider">...</aside>
    <div class="ob-main">
      <header class="ob-header">...</header>
      <main class="ob-content">...</main>
    </div>
  </div>
</div>
```

**多应用**（`shell: app-shell-multi`）：顶栏 L1 + 侧栏当前应用 L2，见 [layouts/app-shell-multi.md](./layouts/app-shell-multi.md)。

```html
<div class="ob-app ob-app--multi">
  <header class="ob-topnav">
    <div class="ob-topnav__brand">...</div>
    <nav class="ob-topnav__apps">
      <a class="ob-topnav__item is-active" href="...">应用 A</a>
      <a class="ob-topnav__item" href="...">应用 B</a>
    </nav>
    <div class="ob-topnav__right"><span class="ob-avatar">管</span></div>
  </header>
  <div class="ob-layout">
    <aside class="ob-sider"><ul class="ob-menu">...</ul></aside>
    <div class="ob-main">
      <header class="ob-header">...</header>
      <main class="ob-content">...</main>
    </div>
  </div>
</div>
```

- 品牌：`.ob-sider__brand` / `.ob-topnav__brand` + `.ob-sider__brand-mark`
- 侧栏菜单：`.ob-menu` > `.ob-menu__group`（可展开）+ `.ob-menu__sub` > `.ob-menu__item`（+ `.is-active`）；无子级可直接 `.ob-menu__item`。**禁止**新页使用 `.ob-menu__section` 不可点小字；**禁止**侧栏放 PRD/包入口
- 顶栏应用：`.ob-topnav__item`（+ `.is-active`）
- 顶栏页签：`.ob-page-tabs` > `.ob-page-tab`（+ `.is-active` 底部主题色描边）；关闭 `.ob-page-tab__close`。右键菜单 `.ob-page-tab-menu`：关闭 / 关闭右侧页面 / 关闭其他页面。无固定首页。`.ob-breadcrumb` 仅兼容旧包

## 页头

```html
<div class="ob-page-title">
  <div class="ob-page-title__main">
    <a class="ob-btn ob-btn--default ob-btn--icon" href="list.html" aria-label="返回"><span class="ob-icon ob-icon--arrow-left" aria-hidden="true"></span></a>
    <h1>园区详情</h1>
  </div>
</div>
```

详情页返回在标题左侧图标按钮；`h1` 不要跟状态 Tag。列表页仍可用右侧 `.ob-page-title__actions` 放「新增」。会跳转离开本页的「前往某某」用 `.ob-btn--jump`。

## 按钮

- `.ob-btn` + 修饰符：`--primary` `--secondary` `--default` `--danger` `--text` `--sm` `--lg`
- 禁用：`disabled` 或 `.is-disabled`

## 表单

- `.ob-field` / `__label` / `__hint`
- 必填标记：`<span class="req">*</span>`
- 基础控件：`.ob-input` `.ob-select` `.ob-textarea`
- **P0/P1 复杂控件（必读分册）**：`references/controls/README.md`  
  DatePicker / Switch / Checkbox·Radio / Cascader / TimePicker / Upload / TreeSelect  
  样式在 `components.css`，开合在 `controls.js`；扩展口径见该 README「默认不扩 kit / 演示刚需可薄补」
- 描述列表：`.ob-desc`（左标签右值；标签淡底、值列白；默认两列对；`.ob-desc--3`；项用 `.ob-desc__item`；格线用 gap，勿 nth-child 去边）
- Tab 一体卡：`.ob-card--tabs`（Tab 与内容同一大卡，见 detail-page）；内嵌表普通 `__body` 留边；表上操作 `.ob-panel-toolbar` 左上
- 表单栅格：`.ob-form-row` 双列；`.ob-form-row--3` 三列（字段短时扩列）
- 页头：详情用 `.ob-page-title__main`（左返回图标 + `h1`）；列表可用右侧 actions；副文本用 `.ob-page-title__desc`（默认勿写裸 `<p>`）
- 列表筛选卡：无「筛选条件」标题；列表卡勿重复页名，工具按钮用 `.ob-card__toolbar`

## 数据展示

- 卡片：`.ob-card` / `__head` `__title` `__body` `__body--flush`
- 表格：`.ob-table-wrap` > `.ob-table`；页脚 `.ob-table-footer`；`.ob-pagination`
- 标签：`.ob-tag` + `--default|--info|--success|--warning|--error`
- 状态：`.ob-status` + `--running|--stopped|--error|--creating`，配合 `.ob-status__dot`
- 页签：`.ob-tabs` + `.is-active`
- 描述列表：`.ob-desc`（dt/dd 栅格）
- 告警：`.ob-alert` + `--warning|--error`
- 空态：`.ob-empty`
- 链接按钮：`.ob-link`
- 头像：`.ob-avatar`

## 筛选栏

- 容器：`.ob-filter`（+ `__spacer`）
- **推荐（OB Filter 浮层面板，勿用原生 select）：**

```html
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
        <button type="button" class="ob-filter-panel__item" data-label="已禁用">已禁用</button>
      </div>
    </div>
  </div>
</div>
<!-- 包内 pages/*.html 使用 ../kits/（见 references/mount-snippet.md） -->
<script src="../kits/ob-static/filter-dropdown.js"></script>
```

- 类名：`.ob-filter-item` / `.ob-filter-trigger` / `__caret` / `.ob-filter-panel` / `__title` / `__list` / `__item`（`.is-open` / `.is-active`）
- 原生 `.ob-select` 仅用于**表单字段**；**列表/工具栏筛选不要用原生下拉。**

### Filter 浮层定位（MUST · 防偏移/被裁切）

面板是 `position: absolute; top: calc(100% + 4px); left: 0`，相对 **`.ob-filter-item`**（`position: relative`）。

1. **祖先禁止随意 `overflow: auto|hidden` 包住 trigger+panel**  
   常见踩坑：卡片 body、Drawer body、sticky 工具栏外层整块滚动。结果：面板被裁切，或跟着滚动看起来「歪/偏」。
2. **正确拆分滚动**  
   - 筛选触发器所在行：`overflow: visible`，不滚动  
   - 只有结果列表 / 表格区域滚动  
3. **结构必须完整**  
   `.ob-filter-item` > `.ob-filter-trigger` + `.ob-filter-panel`（panel 是 item 的直接子节点，不要塞进别的 relative 包装里）。
4. **开合脚本**  
   - 业务页筛选条：用 `filter-dropdown.js`（文档委托）  
   - Runtime 旁路层若自管点击：须 `stopPropagation`，避免与 `filter-dropdown.js` 双开双关导致位置闪动  
5. **贴边**  
   默认左对齐 trigger；若在抽屉右侧且面板会被裁切，可对该实例加 `right: 0; left: auto`（不要全局改 kit）。
6. **z-index**  
   面板默认 `z-index: 40`；若落在更高堆叠上下文（如 `.ps-drawer`），确保工具栏/`filter-item` 的局部 z-index 高于同层列表，仍不必改成 `position: fixed`（静态原型优先 absolute）。

### 何时用 `.ob-select` vs Filter 面板

| 场景 | 用 |
| --- | --- |
| 列表页 / 工具栏筛选条件 | `.ob-filter-item` 浮层面板 |
| 表单里「请选择省市区/类型」字段 | `.ob-select`（原生 select + 样式） |
| 旁路 Runtime 内筛选 | 复用 Filter 面板 class；自管逻辑，遵守上方定位 MUST |

## 浮层（通过 `.is-open` 静态打开）

- `.ob-mask.is-open`
- `.ob-drawer.is-open` / `__head` `__title` `__body` `__foot`
- `.ob-modal.is-open` / `__head` `__body` `__foot`
- 宽度修饰：`.ob-modal--wide`（720）· `.ob-modal--xl`（900）

用少量原生 JS 切换；默认关闭，除非在演示某一状态。细则见 `references/components/overlay-ui.md`。

## 布局辅助

- 内容卡竖向间距：`.ob-stack`
- 底栏工具条：`.ob-footer-bar` / `__extra`
- 分步：`.ob-steps` / `__item`（`.is-active` `.is-done`）+ `__num`
- 双列表单：`.ob-form-grid-2` + `.ob-field--full`
- 环节材料：`.ob-mat-block` / `__head` `__meta` `__body`（状态机详情）
- KPI：`.ob-kpi-grid` > `.ob-kpi` / `__label` `__value` `__hint`
- 图表占位：`.ob-chart-grid` > `.ob-chart-placeholder` + `__bar`
- 结果页：`.ob-result` / `__title` `__desc` `__actions`

页型骨架见 `references/layouts/`。组件级间距/分区/状态见 `references/components/`。业务组合见 `references/components/biz-page/`。复杂表单/筛选控件见 `references/controls/`。

## 建议 / 避免

- 建议：各页复用侧栏结构，保持连贯；顶栏右侧保留用户区（见 `components/chrome.md`）。
- 建议：主操作放在 `.ob-page-title__actions`（整页表单提交放 `.ob-footer-bar`）。
- 建议：列表用双卡 + `.ob-stack`；表格 `--flush`；筛选用 Filter 浮层（见 `components/list-page.md`）。
- 建议：档案弹窗编辑 / 分区发布 / 状态机详情走 `components/biz-page/`，勿临时发明整页结构。
- 建议：日期/开关/级联等一律走 `references/controls/`；缺件时按该目录扩展口径（禁止清单式搬迁，允许演示刚需薄补）。
- 建议：确认/表单浮层用 `.ob-mask` + Modal/Drawer；操作轻提示用 `ObToast`（`.ob-toast`）；页内常驻说明用 `.ob-alert`（见 `components/overlay-ui.md`）。
- 避免：为装饰而卡片套卡片。
- 避免：使用 Ant Design React 类名（`ant-btn`）；坚持 `ob-*`。
- 避免：原生 `input[type=date|time]`、无 class 的系统 checkbox 作为主视觉。
- 避免：`window.alert` / `confirm`。

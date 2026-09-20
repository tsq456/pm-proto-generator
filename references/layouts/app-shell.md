# 应用壳层（App Shell · 单应用）

> 本文为上游未指定时的 kit 默认表现。已确认页面 Spec 的布局、列序、字段、交互与能力边界优先；不据此新增业务能力。

对齐官方：`ob-design template app-basic-layout` · `@oceanbase/ui` BasicLayout + PageContainer。

**组件级细则**：[chrome](../components/chrome.md)（侧栏可展开菜单、顶栏用户区、sitemap 同步）。  
**多应用（顶栏 L1 + 侧栏 L2）**：见 [app-shell-multi.md](./app-shell-multi.md)。

## 适用

- **单一应用**内的中后台业务页外框：左侧导航 + 顶栏 + 内容区
- 同原型包内所有页面应复用同一套壳层结构
- sitemap 根字段缺省或 `shell: app-shell`

不适用：平台下挂多个同级应用、需要顶栏切换应用 → 用 `app-shell-multi`。

## 区块结构（自上而下 / 由外到内）

1. `.ob-app` → `.ob-layout`
2. 左侧 `.ob-sider`：品牌 + **可展开** `.ob-menu`（业务导航 only）
3. 右侧 `.ob-main`
   - `.ob-header`：已打开页签 / 用户区
   - `.ob-content`：业务页内容（各 layout 从这里开始）

## HTML 骨架

```html
<div class="ob-app">
  <div class="ob-layout">
    <aside class="ob-sider">
      <div class="ob-sider__brand">
        <span class="ob-sider__brand-mark">OB</span>
        <span>产品名称</span>
      </div>
      <ul class="ob-menu">
        <li class="ob-menu__group is-open">
          <button type="button" class="ob-menu__group-title" aria-expanded="true">
            <span>资源管理</span>
            <span class="ob-menu__group-caret" aria-hidden="true"></span>
          </button>
          <ul class="ob-menu__sub">
            <li class="ob-menu__item is-active"><a href="tenant-list.html"><span>租户列表</span></a></li>
            <li class="ob-menu__item"><a href="cluster-overview.html"><span>集群概览</span></a></li>
          </ul>
        </li>
      </ul>
    </aside>
    <div class="ob-main">
      <header class="ob-header">
        <nav class="ob-page-tabs" aria-label="已打开页面"></nav>
        <div class="ob-header__right">
          <span class="ob-avatar">管</span>
        </div>
      </header>
      <main class="ob-content">
        <!-- 业务内容：见其他 layout 规范 -->
      </main>
    </div>
  </div>
</div>
<script src="../kits/ob-static/controls.js"></script>
```

## 约束

- 当前页菜单项必须带 `.is-active`；所在 `.ob-menu__group` 须 `is-open`（`controls.js` 会自动展开）。
- 侧栏一级用可点击展开的 `.ob-menu__group-title`，**禁止** `.ob-menu__section` 不可点小字。
- 侧栏**禁止** PRD / 包入口等非业务项（见 [chrome](../components/chrome.md)）。
- 顶栏放空的 `.ob-page-tabs`，由 `controls.js` 按已打开页面渲染。无固定首页；均可关闭；仅剩当前页时不显示关闭。右键页签可关闭、关闭右侧页面、关闭其他页面。选中页签底部为主题色描边。不要手写面包屑。
- 顶栏右侧须有用户区（头像/用户名）；详见 [chrome](../components/chrome.md)。
- 存在 `sitemap.yaml` 时侧栏须与其同步（见根 SKILL「路由与导航」）。
- 不要在侧栏外再套装饰性卡片。
- 移动端可隐藏侧栏，内容区保持可读。

## 禁止

- 每页发明不同侧栏宽度/菜单结构
- 与 `app-shell-multi` 混用在同一包
- 使用 `ant-layout` / `ant-menu` 类名
- 省略顶栏用户操作区

# 多应用壳层（Top L1 + Sider L2）

对齐大型中台：顶栏切换**同级应用/产品**，下方左侧为当前应用内导航，右侧为内容区。

**组件级细则**：[chrome](../components/chrome.md)（可展开侧栏、禁止非业务项）。单应用请用 [app-shell.md](./app-shell.md)。

## 适用 / 不适用

| 适用 | 不适用 |
| --- | --- |
| 超大型项目，其下有多个**同级别应用/产品线** | 单一应用、菜单都在同一产品内（用 `app-shell`） |
| 顶栏需要在应用间切换，侧栏只展示**当前应用**的二级及以下 | 仅需折叠侧栏、或只要顶栏无侧栏 |

同包内**只选一种壳层**，写入 `sitemap.yaml` 根字段 `shell: app-shell-multi`（缺省视为 `app-shell`）。

## 与 sitemap 的映射（MUST）

| 导航区 | 来源 |
| --- | --- |
| 顶栏一级（应用切换） | `groups` 的 **L1**（每个 L1 = 一个同级应用） |
| 左侧可展开一级 | 当前 L1 下的 **L2** → `.ob-menu__group` |
| 左侧二级末级 | 挂到该 L2（及展平后的 L3）的 `pages[]` → `.ob-menu__sub` 内 item |
| 内容区 | 当前页 `pages[].path` |

- 当前页所属 L1：对应顶栏项 `.is-active`；侧栏只渲染该 L1 子树，**不要**把其他应用的菜单塞进侧栏。
- 点顶栏其他应用：跳到该 L1 下默认页（`defaultPages` 或首个非 planned 页）。
- Runtime「导航目录」仍读整份 sitemap；**不替代**顶栏/侧栏同步义务；**不**因此把 PRD/包入口写进业务侧栏。

可选（推荐写在 sitemap 根）：

```yaml
shell: app-shell-multi
defaultPages:
  prod-ops: tenant-list
```

## 区块结构

```
.ob-app.ob-app--multi
├─ .ob-topnav                    # 顶栏：品牌 + L1 应用 + 用户区
│  ├─ .ob-topnav__brand
│  ├─ .ob-topnav__apps → .ob-topnav__item
│  └─ .ob-topnav__right           # 用户区（MUST，勿再省略）
└─ .ob-layout
   ├─ .ob-sider                  # 仅当前应用业务导航
   │  └─ .ob-menu（group 可展开，无 section 小字）
   └─ .ob-main
      ├─ .ob-header              # 已打开页签（用户区已在顶栏）
      └─ .ob-content
```

## HTML 骨架

```html
<div class="ob-app ob-app--multi">
  <header class="ob-topnav">
    <div class="ob-topnav__brand">
      <span class="ob-sider__brand-mark">OB</span>
      <span>平台名称</span>
    </div>
    <nav class="ob-topnav__apps" aria-label="应用">
      <a class="ob-topnav__item is-active" href="tenant-list.html">运维中心</a>
      <a class="ob-topnav__item" href="order-list.html">订单中心</a>
      <a class="ob-topnav__item is-disabled" aria-disabled="true">计费中心</a>
    </nav>
    <div class="ob-topnav__right">
      <span class="ob-avatar">管</span>
    </div>
  </header>
  <div class="ob-layout">
    <aside class="ob-sider">
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
        <li class="ob-menu__group">
          <button type="button" class="ob-menu__group-title" aria-expanded="false">
            <span>数据保护</span>
            <span class="ob-menu__group-caret" aria-hidden="true"></span>
          </button>
          <ul class="ob-menu__sub">
            <li class="ob-menu__item"><a href="backup-policy-form.html"><span>备份策略</span></a></li>
          </ul>
        </li>
      </ul>
    </aside>
    <div class="ob-main">
      <header class="ob-header">
        <nav class="ob-page-tabs" aria-label="已打开页面"></nav>
      </header>
      <main class="ob-content">
        <!-- 业务内容 -->
      </main>
    </div>
  </div>
</div>
<script src="../kits/ob-static/controls.js"></script>
```

## 约束

- 顶栏 L1 与侧栏 **职责分离**：应用切换只在顶栏；应用内页面只在侧栏。
- 侧栏**不要**再放平台级品牌大标题抢顶栏（省略 `.ob-sider__brand`）。
- 侧栏一级可展开；**禁止** `.ob-menu__section` 不可点小字；**禁止** PRD/包入口等非业务项。
- 当前页侧栏 item、当前应用顶栏 item 均须 `.is-active`；所在 group `is-open`。
- 用户区在 `.ob-topnav__right`（本壳层 MUST）；`.ob-header` 放 `.ob-page-tabs`，不要面包屑。右键页签可关闭、关闭右侧页面、关闭其他页面。
- `planned` / 无 path：顶栏或侧栏灰显，勿链 404。
- 移动端：可藏侧栏；顶栏应用项可横向滚动，须仍能切换应用。

## 禁止

- 与 `app-shell` 混用在同一包的不同页（同包壳层必须一致）
- 把多个应用的完整菜单叠在同一侧栏里「假装多应用」
- 使用 `ant-layout` / `ant-menu` 类名
- 省略顶栏用户操作区
- 业务侧栏放文档/评审类入口

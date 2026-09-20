# 工作台壳层（Chrome）

对齐 `ob-app` / `ob-layout` / `ob-sider` / `ob-header` /（多应用）`ob-topnav`。  
骨架：单应用 [app-shell](../layouts/app-shell.md) · 多应用 [app-shell-multi](../layouts/app-shell-multi.md)。

## 何时使用

- 任意中后台业务页外框
- 同包多页须共用**同一种**壳层 DOM 与菜单结构

**不要**每页发明不同侧栏宽度；**不要**省略用户操作区（单应用在顶栏右侧，多应用在 `.ob-topnav__right`）。

---

## 壳层选型（包级 · MUST）

| 壳层 | sitemap | 结构 | 适用 |
| --- | --- | --- | --- |
| **单应用**（默认） | `shell: app-shell` 或省略 | 左侧全量导航 + 顶栏页签/用户 | 单一产品/应用 |
| **多应用** | `shell: app-shell-multi` | 顶栏 L1 应用切换 + 左侧当前应用 L2 + 内容区 | 平台下多个同级应用 |

同包禁止混用两种壳。选型后全包页面复制同一骨架。

### 单应用（默认）

```
.ob-app > .ob-layout
├─ .ob-sider（品牌 + .ob-menu ← 全部业务导航）
└─ .ob-main
   ├─ .ob-header（已打开页签 | 用户区）
   └─ .ob-content（业务页）
```

### 多应用

```
.ob-app.ob-app--multi
├─ .ob-topnav（品牌 | L1 应用 .ob-topnav__item | 用户区）
└─ .ob-layout
   ├─ .ob-sider（仅当前 L1 下的业务导航；可不放 brand）
   └─ .ob-main
      ├─ .ob-header（已打开页签；用户区已在顶栏）
      └─ .ob-content
```

| 区域 | 尺寸 / Token |
| --- | --- |
| 侧栏宽 | `208px`（`.ob-sider`） |
| 侧栏底 | `--ob-navi-color-bg` |
| 顶栏（单应用 `.ob-header` / 多应用 `.ob-topnav`） | 高约 48px，底边 `--ob-color-border-container` |
| 内容区 | `padding: var(--ob-space-600)`，背景 `--ob-color-bg-secondary` |

---

## 侧栏菜单结构（MUST · 正式原型）

对齐中台侧栏（可展开一级 + 缩进二级），**不要**用不可点击的灰色小字分组（`.ob-menu__section`）。

| 层级 | DOM | 行为 |
| --- | --- | --- |
| 有子页的模块 | `.ob-menu__group` > `.ob-menu__group-title` + `.ob-menu__sub` | 点击标题收起/展开；右侧 caret |
| 末级页面 | `.ob-menu__sub` 内 `.ob-menu__item` > `a` | 当前页 `.is-active` |
| 无子级的单页 | 直接 `.ob-menu__item`（不套 group） | 如「工作台」「仪表盘」 |

```html
<ul class="ob-menu">
  <li class="ob-menu__item"><a href="dashboard.html"><span>工作台</span></a></li>
  <li class="ob-menu__group is-open">
    <button type="button" class="ob-menu__group-title" aria-expanded="true">
      <span>空间资产</span>
      <span class="ob-menu__group-caret" aria-hidden="true"></span>
    </button>
    <ul class="ob-menu__sub">
      <li class="ob-menu__item is-active"><a href="park-list.html"><span>园区管理</span></a></li>
      <li class="ob-menu__item"><a href="plot-list.html"><span>地块管理</span></a></li>
    </ul>
  </li>
</ul>
```

- 引入 `kits/ob-static/controls.js`：点击标题切换 `.is-open`；含 `.is-active` 的分组**默认展开**。
- 展开箭头：`.ob-menu__group-caret` 使用 kit 内 **Heroicons**（MIT）`icons/chevron-down.svg`（收起向右、展开向下），勿再手写 CSS 边框三角。
- `planned`：末级用 `.is-disabled` / `aria-disabled`，无 `href`，勿链 404。
- sitemap：多应用时侧栏 group ≈ 当前应用下的 L2；末级 ≈ pages（L3 叶子可展平进同一 `ob-menu__sub`，避免再套不可点小标题）。

### 禁止放进业务壳层侧栏（MUST）

正式业务页侧栏**只放业务导航**。以下入口放在包根 `index.html`（PRD 汇总）、FAB「原型说明 / 导航目录」、或 `docs/` 直链，**不要**塞进 `.ob-sider`：

- PRD 汇总、包入口、评审入口、技能说明、更新记录等非业务项
- 「文档」类分组标题

### 废弃写法（勿用于新页）

`.ob-menu__section` 仅兼容旧包；**新页禁止**用 section 小字代替可展开一级。

---

## 多应用壳补充

| 区域 | sitemap | 表现 |
| --- | --- | --- |
| 顶栏 | L1 groups | `.ob-topnav__item`；当前应用 `.is-active` |
| 侧栏 | 当前 L1 下的 L2 + pages | 上表可展开菜单；**不含**其他 L1 |

---

## 用户操作区（MUST）

| 壳层 | 位置 | 要求 |
| --- | --- | --- |
| 单应用 | `.ob-header__right` | 至少 `.ob-avatar`（可加用户名）；推荐消息/退出 |
| 多应用 | `.ob-topnav__right` | 同上；`.ob-header` 可无右侧用户区 |

`.ob-header` 左侧为已打开页面的页签条 `.ob-page-tabs`（由 `controls.js` 渲染），**不要**再放面包屑。无固定首页页签，打开过的页面都可关闭；仅剩当前页时不显示关闭。点页签切换，选中项底部为主题色描边（`--ob-color-border-selected`）并带浅蓝底。在页签上右键打开菜单：关闭、关闭右侧页面、关闭其他页面。仅剩一个页签时「关闭」「关闭其他页面」不可用；右侧没有页签时「关闭右侧页面」不可用。关掉当前页后落到左侧相邻页，没有则落到右侧相邻页。与内容区 `.ob-tabs` 无关。`.ob-breadcrumb` 仅兼容旧包。

---

## 与 sitemap 同步（MUST）

包内存在 `sitemap.yaml` 时：

1. 按 `shell` 映射：单应用 → 侧栏吃全树；多应用 → 顶栏 L1、侧栏仅当前 L1 子树；链接与 `pages[].path` 一致  
2. 改 sitemap 的同一轮必须改各页壳层菜单（及多应用顶栏）；包根 `index.html` 保持为 PRD 汇总  
3. Runtime「导航目录」不替代壳层同步义务；**不**因此把 PRD/包入口写进业务侧栏  

详见根 `SKILL.md`「路由与导航」与 [app-shell-multi](../layouts/app-shell-multi.md)。

---

## 状态

| 状态 | 表现 |
| --- | --- |
| 菜单默认 | 导航色文字 |
| hover | `.ob-navi-color-bg-hover`（侧栏）/ 顶栏 item 浅底 |
| 选中 | 侧栏 `.is-active` → 选中底 + 反色字；顶栏 `.is-active` → 字重 + 底边选中色 |
| 分组展开 | `.ob-menu__group.is-open` 显示 `.ob-menu__sub` |
| 侧栏整栏折叠 | 静态原型可选；若演示，内容区仍须可读 |

---

## 禁止

- 内容区再套一层全屏灰底壳（`.ob-content` 已是工作区）
- 使用 `ant-layout` / `ant-menu`
- 业务主操作按钮放进侧栏（主 CTA 在页头或底栏）
- 同包混用 `app-shell` 与 `app-shell-multi`
- 业务侧栏放 PRD / 包入口 / 评审等非业务链接
- 用 `.ob-menu__section` 不可点小字充当一级菜单

## Checklist

1. 全包共用同一种壳与产品/平台名  
2. 当前页侧栏 `.is-active`；（多应用）当前应用顶栏 `.is-active`；所在分组 `is-open`  
3. 用户区在规定位置  
4. 菜单与 sitemap / `shell` 映射一致；侧栏无非业务项；一级可展开  

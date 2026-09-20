# sitemap.yaml 规范

## 文件位置

包根：`prototypes/<slug>/sitemap.yaml`（与 `proto-spec/`、`changelog.yaml` 并列）。

## 语义

- **groups**：L1/L2/L3 分组，只用于导航与 PRD 展示，**不是**可打开页面  
- **pages[] / children[]**：功能**明细子页面**（列表、详情、表单、大屏等）  
- `page.id`：页面唯一编码（见下方「page.id 命名」），等于 `proto-spec/<page-id>.md` 文件名与 Runtime frontmatter `id`

---

## page.id 命名（MUST · 本技能定稿）

**在 Phase 3 写 sitemap 时就必须定好**；后续 `proto-spec/`、`meta.yaml`、changelog、HTML path 一律沿用，禁止画原型时再发明另一套 id。

### 公式

```text
{entity}-{pageType}
```

- 全小写 **kebab-case**
- `entity`：业务对象英文词干（稳定、可拼读）；同一资源全家页共用同一 entity  
- `pageType`：页型后缀（下表）；一词为主，必要时再加修饰（如 `tenant-create` / `tenant-edit`）

### pageType 后缀表

| pageType | 含义 | 常见 layout |
| --- | --- | --- |
| `list` | 列表（筛+表+分页） | list-filter-table |
| `detail` | 只读详情 | detail-descriptions |
| `create` | 新建整页/主入口创建 | form-page / form-in-drawer / form-in-modal |
| `edit` | 编辑整页（与 create 分页时） | form-page / … |
| `form` | 新建编辑同页、或不拆 create/edit | form-page |
| `overview` | 概览 / KPI | chart-overview |
| `dashboard` | 大屏 | chart-overview |
| `result` | 结果页 | result-page |

业务组合模式（档案弹窗编辑等）**不另发明后缀**：仍用资源页型（如档案主列表 `provider-list`，详情 `provider-detail`）；模式写在 Spec / layout 备注，不写进 id。

### 正例 / 反例

| 正例 | 说明 |
| --- | --- |
| `tenant-list` | 租户列表 |
| `tenant-detail` | 租户详情（可为 list 的 children） |
| `tenant-create` | 新建租户 |
| `backup-policy-list` | 多词 entity 仍 kebab |
| `order-detail` | 订单状态机详情 |

| 反例 | 原因 |
| --- | --- |
| `tenantList` / `Tenant_List` | 必须 kebab-case |
| `list` / `detail` | 缺 entity，包内必撞名 |
| `tenant` | 缺 pageType，看不出页型 |
| `tenant-列表` | 禁止非 ASCII |
| `mod-tenant` | `mod-` 是分组风格，不要当 page.id |
| `page1` / `p-tenant-list` | 无业务语义 / 多余前缀 |

### 与 path、children

| 项 | 约定 |
| --- | --- |
| `path` | 推荐 `pages/{page-id}.html`（与 id 同名） |
| 列表的详情/编辑 | 优先挂在 list 的 `children[]`，id 仍全局唯一（`tenant-detail`，不要 `detail`） |
| 同 entity 多列表 | 加场景词：`tenant-quota-list` vs `tenant-list` |
| 改名 | 视为新 id：改目录、`meta`、changelog key，并记 changelog；旧 id `deprecated` |

### groups[].id（对照，勿混用）

分组用稳定前缀，**不是** page 公式：

- L1：`role-{slug}`（如 `role-admin`）或场景一 `prod-{slug}`
- L2/L3：`mod-{slug}`（如 `mod-tenant`）

---

## 骨架

见 [../templates/sitemap.yaml](../templates/sitemap.yaml)。

### 关键字段

| 字段 | 说明 |
| --- | --- |
| `docVersion` | 与 PRD DOC_VERSION 一致 |
| `scenario` | `multi-user`（场景二）\| `multi-product`（场景一） |
| `shell` | 包级壳层：`app-shell`（默认，单应用侧栏）\| `app-shell-multi`（顶栏 L1 应用 + 侧栏当前应用 L2）。同包一种 |
| `defaultPages` | 可选；`app-shell-multi` 时 `{ l1GroupId: pageId }`，顶栏切换应用的落地页 |
| `groups[].id` | 稳定 id（`role-` / `mod-` / `prod-`…），增量时勿乱改 |
| `groups[].level` | `L1` \| `L2` \| `L3` |
| `groups[].children` | 子分组或省略 |
| `pages[].id` | **page-id**，遵守 `{entity}-{pageType}` |
| `pages[].name` | 中文名 |
| `pages[].groupId` | 所属末级分组 id |
| `pages[].layout` | 建议业务布局（layouts 文件名不含 .md；**不是**壳层名） |
| `pages[].status` | `planned` \| `draft` \| `reviewing` \| `confirmed` \| `deprecated` |
| `pages[].version` | 如 `0.1.0` |
| `pages[].path` | 推荐 `pages/{id}.html`（可先空） |
| `pages[].hideInPrdPageList` | `true` 时不进 PRD 清单与 PRD 汇总页 |
| `pages[].hideInNav` | `true` 时不进 Runtime「导航目录」 |
| `pages[].children` | 从属明细页（详情等） |

**壳层与 groups：**

- `app-shell`：侧栏渲染完整 groups → pages 树  
- `app-shell-multi`：顶栏 = L1；侧栏 = 当前页所属 L1 的子树。见 `references/layouts/app-shell-multi.md`

## 增量遍历算法（MUST）

收到增量需求时：

1. **Load** 现有 `sitemap.yaml`；若缺失则询问路径或声明「按新项目 Phase 3」。  
2. **Normalize** 需求中的候选页面（名称、角色、是否详情从属）→ **先拟定 page-id**（entity + pageType）。  
3. **Match** 对每个候选：  
   - 已有相同 `id` 或同 entity+同 pageType 同职责 → **改页**（升 version，改 Spec），不新建分组  
   - 同 L2 下新末级菜单 → **新 page**，按命名公式取 id，`groupId` 指向该 L2/L3  
   - 新功能模块 → **新 L2**（及必要时 L3）+ 新 page  
   - 列表下的详情/编辑 → 优先 `children`，id 如 `{entity}-detail`，不新开 L2  
4. **Report** 增补建议表后再改文件：

| 候选页 | 动作 | 挂载 groupId / 父 page | 新 page-id | 影响面 |
| --- | --- | --- | --- | --- |

5. **Apply** 准备 sitemap 变更草案 → 只为新增/变更页生成 Spec → 合并评审并记录本批确认 → 才交接实现；`changelog.yaml` 追加。  
6. **若包内已有静态原型**：提醒下一轮 `pm-proto-generator`（或本轮若兼做）**同步壳层导航与 index 链接**（含多应用顶栏）；sitemap 是路由唯一来源，不自动改 HTML。  
7. **删除同步（MUST）**：用户明确删页或 HTML 已移除时，**禁止**只留 sitemap/空分组占位。须同时：  
   - 从 `sitemap.yaml` 删除对应 `pages[]`（及空的 `mod-*` 分组）  
   - 删除 `proto-spec/<page-id>.md`（若存在）  
   - 更新包根 `index.html`（PRD 汇总）导航入口 / `docs/menu-plan.md` / 包级概述  
   - 跑 `python3 <本仓库>/scripts/check_page_prd_sync.py <包根>` 确认无孤儿  

废弃但暂留导航时用 `status: deprecated`；**已删原型页**走删除同步，不要用 deprecated 遮盖。

## 校验清单

- [ ] 无「模块名」独占一行 pages  
- [ ] 每个 page.`id` 符合 `{entity}-{pageType}`；全局唯一（含 children）  
- [ ] `groupId` 均能解析到 groups；group id 未误用作 page id  
- [ ] hideInPrdPageList 仅用于设计/内部页  
- [ ] 增量未**静默**删除旧页；明确删页时已双向清理 sitemap + Spec + 入口  
- [ ] 已提示或完成：导航 / index 与 sitemap 对齐（有原型时）  
- [ ] `check_page_prd_sync.py` 无 ERROR（缺 HTML 的 draft 页、无 sitemap 的 Spec）

## 与 Runtime / 原型

| 产物 | 消费者 |
| --- | --- |
| `pages[].id` | `proto-spec/<id>.md`、`ProtoSpecRuntime.mount({ pageId })`、changelog key |
| `pages[].layout` | `pm-proto-generator` 选业务 layouts（列表/详情等） |
| `pages[].path` | 入口 index / 壳层链接（**改 sitemap 必须同步**） |
| `shell` | 包级选用 `app-shell` 或 `app-shell-multi` |
| groups 树 | 壳层菜单（映射随 `shell`）；Runtime「导航目录」按 **L1** 展平展示页面 |

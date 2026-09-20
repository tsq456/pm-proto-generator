# sitemap 与本地映射

`sitemap.yaml` 是原型包的导航与路由来源，由已确认 IA/页面关系派生，不是下游重新设计的信息架构。无全局 IA 的简单模块可消费上游已明确的页面关系；入口和承载方式不明确时反馈，不自建菜单。

## 页面映射

- 本地新 page-id 使用小写 `{entity}-{pageType}`，如 `tenant-list`、`asset-workbench`、`asset-detail`，页型后缀按实际职责命名，不把非列表强塞列表模板。
- 已有包优先保持原 page-id、path 和数据 ID；上游中文改名不自动改技术 ID。
- 文件名、frontmatter `id`、sitemap `id` 和 Runtime `pageId` 必须一致。
- 本地 ID 只为实现稳定；上游无需提供。以来源文件/页面引用＋业务名称/职责定位，同名对象以模块、父级和业务归属区分，不凭名称自动合并。
- 默认页面路径 `pages/<page-id>.html`。Tab、弹窗、抽屉记录宿主，不创建独立页面或导航项。
- 页面内部业务树不是壳层菜单；页面的数据层级不能自动转成 sitemap 层级。

字段、业务状态和具名 Mock 对象的技术键在接收记录集中分配。技术命名不改变业务语义；已有正式契约则沿用。派生层级路径、子项数量必须有唯一关系依据。

## 格式

模板见 [sitemap.yaml](../templates/sitemap.yaml)。为兼容 Runtime 和无依赖检查器，使用显式多行列表/映射；不要使用 YAML anchors、merge、tags 或 flow 对象表示 pages/groups。

| 字段 | 用途 |
| --- | --- |
| `docVersion` / `updatedAt` | 本地地图修订与日期；不是伪造上游确认版本 |
| `scenario` | multi-user 或 multi-product |
| `shell` | app-shell 或 app-shell-multi，同包统一；按入口结构选择 |
| `groups` | 已确认的导航分组，id/name/level/children；不自动给每个页面建菜单 |
| `pages` | id/name/groupId/layout/status/version/path/children |
| `hideInNav` / `hideInPrdPageList` | 延续 Runtime 现有展示能力，不用于掩盖未实现入口 |
| `defaultPages` | 多应用壳层的 L1 默认 page-id 映射 |

状态保持 Runtime 现有值：`planned`（范围外或待安排）、`draft`/`reviewing`（派生草稿或受阻）、`confirmed`（来源确认有效且派生核对通过）、`deprecated`（上游明确废弃）。状态不代表 HTML 已完成；实际覆盖由逐页说明记录。子页面可继承父项 groupId。

## 增量与导航

1. 读取原接收记录和 sitemap，匹配来源页面及职责。
2. 只更新新版上游明确影响的页面、映射和说明，不因未提及旧页而删除。
3. 导航关系变化时，主技能同步侧栏、顶栏槽、跨页链接和包根入口；单纯字段变化只核对导航无影响。
4. 未实现、planned 或无 path 的入口灰显，不生成 404 链接；已确认但尚未实现的下一批页面同样不能假装可访问。
5. 删除/废弃须有明确依据，记录受影响入口；实施时同步 HTML、sitemap、Spec 和导航，不用“缺 HTML”反推删除需求。

## 检查

只生成说明：`python3 <技能仓库>/scripts/check_page_prd_sync.py <包根> --stage spec`。

实现本批：`python3 <技能仓库>/scripts/check_page_prd_sync.py <包根> --stage prototype --page-id <id> --page-id <id>`。

不指定页面时，原型阶段检查全部非 planned/deprecated 页面。自动检查只验证结构对应，不代替业务授权、可点击路径或视觉检查。

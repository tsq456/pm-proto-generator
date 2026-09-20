---
name: pm-proto-generator
description: >-
  仅用于「采用本静态原型体系」的产品交付：生成/维护自包含静态 HTML 原型包
  （ob-static + proto-spec Runtime + 可选 ProtoMock），含 sitemap/页级 Spec、
  中后台线框页、包根 index.html 为 PRD 汇总。在用户明确要 PM 静态原型包、
  proto-spec、按 pm-proto-generator 交付、或在已有该体系包上增量改页/补 Spec 时使用。
  不要因单独提到 PRD、mock 数据、图表/列表布局、OceanBase Design 或文案微调就启用。
---

# PM-PROTO-GENERATOR

## 目标

产出一份**自包含的静态原型包**，向研发与测试讲清产品意图：

1. 多页 HTML 线框（OceanBase Design 视觉语言）
2. **原型说明系统**（旁路 Drawer，读 `proto-spec/`，无页内 Annotation 打点）
3. **可演示的 Mock 交互**（ProtoMock：列表增删改、跨页数据同步，非写死静表）
4. 包级 PRD 汇总（包根 `index.html` + Runtime；**全包交付必选**，增量/只写 Spec 见下方任务分支）

交付物不使用 React，也不做 npm 构建。业务页建议用静态服务器打开（说明 Runtime 需 `fetch` Spec）。

对话中可说：`按 PM-PROTO-GENERATOR skill …` 或 `按 pm-proto-generator …`。

## 适用 / 不适用（触发边界）

| 适用 | 不适用（勿启用本技能） |
| --- | --- |
| 要用本仓库 kits 出/改**静态原型包**（含 Spec、旁路说明、可选 ProtoMock） | 只要普通 Markdown/飞书 PRD，不要静态原型包 |
| 已有 `prototypes/<slug>` 这类包上的增量页、补 Spec、修导航 | 只要改一句文案、改色值、改单个控件样式 |
| 用户点名 `pm-proto-generator` / proto-spec / 自包含静态原型 | 正式产品用 React + `@oceanbase/design` 实现 |
| — | 只要「mock 数据 / 图表布局 / 列表布局」等零散需求，且未要求本静态原型体系 |
| — | 通用前端脚手架、npm/Vite/Next 应用、非本包结构的 HTML |

进入后仍须按下方**任务分支**裁剪，禁止小改动默认跑新建全包。

## 解决「OB Design + 静态 HTML」

OceanBase Design（`@oceanbase/design`）是 React + CSS-in-JS。**不要**在 PM 原型中依赖 React。

**标准做法（请用这个）：**

1. **初始化包时 vendoring kits**（复制，不编译）：
   `python3 <本仓库>/scripts/init_prototype.py prototypes/<slug> --name <slug>`  
   → 包内出现 `kits/ob-static/`、`kits/proto-spec-runtime/`、`kits/proto-mock/`（静态 CSS/JS，**不是**现场根据 kit 再生成 CSS）
2. 页面引用**包内** kits：入口 `kits/...`，`pages/` / `docs/` 用 `../kits/...`（唯一范例：`references/mount-snippet.md`）
3. 类名 `ob-*`；控件见 `references/controls/`；页型见 `references/layouts/`；业务组合见 `references/components/biz-page/`
4. 每页 `proto-spec/<page-id>.md`（frontmatter 含 id/name；正文为页面说明），`page-id` = `{entity}-{pageType}`（由 `proto-spec-generator` 定稿）
5. **跨页 CRUD**：用 `kits/proto-mock` + `mock-data/*.json`；列表由 `ProtoMock.list` 渲染，禁止只写死 `<tr>` 却声称可交互
6. **控件扩展口径**（详见 `references/controls/README.md`）：默认用现成 P0/P1 kit；**禁止**按官方组件清单批量往 kit 搬迁。当前页演示刚需且交互浅时，允许页内或 kit **薄补**（复用 `ob-*` Token/模式，不宣称与 React 像素级一致）；高复杂度（AutoComplete、远程 Transfer、完整 Upload 等）仍用占位 + Spec 注明正式用 `@oceanbase/design`

**除非用户明确要求，否则避免：**

- CDN React + `@oceanbase/design` UMD
- 手写紫色/通用后台主题；另造设计体系
- 页内数字角标 / `proto-anno` / 说明气泡
- 只建空目录却不复制 kits（包将无法离线/单独部署）
- 为「对齐官方目录」而批量新增 Segmented/Transfer/Badge 等 kit 控件

## 编号对照（避免混读）

| 体系 | 含义 |
| --- | --- |
| 本技能步骤 0～10 | 画原型时的执行顺序（下方「工作流」；仅**新建全包**默认全跑） |
| 子技能 Phase 0～8（含 2.5） | **需求拆解**阶段：2.5=角色×场景+P0 页；3=sitemap；5=本批 Spec 实现前确认。与本技能「步骤 3」无关 |

## 任务分支（开场 MUST 判定）

先根据用户意图选分支，**禁止**默认按「新建全包」跑完所有步骤。

| 分支 | 典型诉求 | 必做 | 默认不做 |
| --- | --- | --- | --- |
| **A. 新建全包** | 从 0 出可演示原型包 | 无 sitemap/Spec 则先子技能；缺 kits 则 init；按工作流实现页 + ProtoMock（若有列表 CRUD）+ 包根 `index.html` PRD 汇总 + 冒烟 | — |
| **B. 增量改页** | 已有包，加/改少量页或交互 | 读现有 sitemap/Spec/HTML；只改涉及页；同步侧栏/`index`/changelog；**删页时双向清理** sitemap + `proto-spec/<id>.md` + 入口；按条件验收。输入是截图或模糊需求、且会改页面结构时，仍先走模糊需求澄清 | 不重跑 Phase 0～8；不强制重写整份 PRD；不重复 init |
| **C. 只写 Spec** | 只要 sitemap/Spec/需求拆解 | 走 `proto-spec-generator`；可有 PRD 骨架 md | 不画业务 HTML；不接 ProtoMock；不强制 `prd.html` 可检索 |
| **D. 补页说明** | 已有 HTML，补/改 Spec | 从页面提取可见行为写/改 `proto-spec/<page-id>.md`；差异交人裁决 | 不改 sitemap（除非发现缺页）；不重做整包 |

**交接查缺：** 进入本技能时先看包内是否已有 `kits/`、`sitemap.yaml`、`proto-spec/`、`docs/prd.md|prd.html`。已有则**只补缺**，禁止再跑一遍 `init_prototype` 覆盖。职责见 `skills/proto-spec-generator/references/handoff.md`。

## 页面实现前确认（MUST）

新建页面或改变业务方案时，先完成 **站点地图 + 页面清单 + 本批各页 Spec**，经人工确认后才生成本批业务 HTML / Mock。按核心流程分批，不要求整站一次确认。仅 sitemap 已确认或 Spec 文件存在不代表可以实现。

**截图或模糊需求不是确认。** 输入是截图、竞品图、口述「做个类似的」，或只有目标没有页面结构时，必须先按 [模糊需求澄清](skills/proto-spec-generator/references/fuzzy-clarify.md)，使用 [统一确认稿格式](skills/proto-spec-generator/references/confirmation-format.md) 交功能定位、结构草稿与关键业务字典，并一轮问完（最多八个影响方向、骨架或关键业务含义的问题）。人改完或明确同意之前：不写 `proto-spec` 正文里的已定规则，不写业务 HTML / Mock。贴图或「做吧」不算同意。文案、间距等小改，以及已确认 Spec 上的具体授权，不走这道前置。

必读 [本批 Spec 确认规则](references/proto-spec/review-gate.md)：评审材料、`docs/spec-review.md` 的版本与确认依据、阻塞问题、增量重审及已有授权复用。普通文案/样式小改、按已确认 Spec 修复原型不增加审批。

## 工作流（分支 A 默认；B/C/D 按上表裁剪）

0. **若尚无 sitemap / 页级 Spec**：先按子技能 `skills/proto-spec-generator/`（模糊输入先 [fuzzy-clarify](skills/proto-spec-generator/references/fuzzy-clarify.md)，再 Phase 2.5 拆清、sitemap，准备本批 Spec；未通过实现前确认不得画本批业务页）。子技能若已 init，本步骤**跳过**重复初始化。
1. 澄清范围（未决的范围 / 关键业务规则 / 核心页方案才用人确认；模糊输入的结构项按 fuzzy-clarify 一轮问完，不要逐条问）。
2. **布局选型**：有表单先读 `references/form-carrier.md`；再 `references/layouts/` + `components/` + `biz-page/`。
3. **初始化目录（仅当包内尚无 kits）**：`python3 scripts/init_prototype.py prototypes/<slug>`（或等效复制 kits + 骨架）。详见 `references/package-structure.md`。
4. 按 sitemap 补齐本批 `proto-spec/<page-id>.md`，提交完整材料并记录人工确认；只按已确认批次生成 `pages/{page-id}.html`。实质变更追加 `changelog.yaml`。
5. **接 ProtoMock**（本包含列表增删改同一实体时）：`mock-data/` 种子 + 页内 `bootstrap` / `list` / `create` / `update` / `remove`。详见 `references/proto-mock.md`。
6. 业务页 mount：必传 `pageId` + `specBase` / `changelogUrl` / `sitemapUrl` / `prdUrl`。**唯一可复制范例**：`references/mount-snippet.md`。
7. 改 sitemap → 同步侧栏与包根（handoff 勾选表）。
8. **全包交付**落地包根 `index.html` 为可打开的 PRD 汇总（子技能可只给 `docs/prd.md` 骨架；本技能负责 mountPrdHub，见 handoff）。
9. （已并入第 8 步）勿再做单独的清单墙首页。
10. 冒烟：按下方「产出检查清单」通用项 + 适用的条件项执行。

## 包结构

```
prototypes/<slug>/          # 自包含，可单独挂静态服务器
  kits/                     # 初始化时从技能仓库复制
    ob-static/
    proto-spec-runtime/
    proto-mock/
  mock-data/                # 实体种子 JSON（ProtoMock）
  index.html                # PRD 汇总首页
  sitemap.yaml
  pages/
    {page-id}.html
  changelog.yaml
  proto-spec/<page-id>.md
  docs/prd.md               # 可选包级概述
```

| 文件位置 | kits 前缀 |
| --- | --- |
| `index.html` | `kits/...` |
| `pages/*.html`、`docs/*.html` | `../kits/...` |

示范：`examples/proto-spec-demo/`；可交互 CRUD 见 `prototypes/style-review/pages/tenant-list.html`。

## 原型说明入口（Runtime）

- 右侧悬浮 **原型说明**；移入后上方展开 **更新记录**、**导航目录**（按 sitemap L1；可链 PRD），主按钮保持原位。
- 三抽屉互斥；导航**不替代**壳层侧栏同步义务。
- 详见 `kits/proto-spec-runtime/README.md`。

## 编写规则

- 真实中文业务文案；禁止 lorem。
- **界面文案**遵守 `references/copywriting.md`（提炼自 [Ant Design 文案](https://ant.design/docs/spec/copywriting-cn)）：用户可见文案不得出现 Mock/ProtoMock/localStorage/「仅影响原型」/「请用 http 静态服务」等实现口吻；确认框、空态、Toast 写产品语言。输入占位默认「请输入 / 请选择」，单位用前缀后缀，见 `references/controls/input.md`。**业务页禁止**放置原型专用控件（如「重置数据」/`ProtoMock.reset` 按钮）；演示能力只走旁路 FAB。
- 每页一种 `layouts` 页型；**同包统一一种壳层**：`app-shell`（单应用）或 `app-shell-multi`（顶栏 L1 + 侧栏 L2，见 `references/layouts/`）。侧栏用可展开 `.ob-menu__group`，**禁止** `.ob-menu__section` 小字；**禁止**业务侧栏放 PRD/包入口等非业务项（见 `references/components/chrome.md`）。
- **说明内容默认写在 `proto-spec/<page-id>.md`**（frontmatter + 正文）；弹窗/抽屉浮层写在**宿主 HTML**，一般不另开 page-id。
- **proto-spec 是 Screen Spec**：围着本页分区/控件/数据口径写（见 `references/proto-spec/spec-template.md` + `README.md`）；**新需求以 Spec 驱动页面**；补说明与差异裁决见同目录 README。产品要求与原型覆盖分开写。
- **新项目只写扁平单页 Spec**；不要拆成 meta/business/flow/fields/interaction 五文件或每页子目录。旧四分册模板仅在维护旧包时按需加载（见 `references/proto-spec/README.md`「旧模板」）。
- 表述为「对齐 Token 的静态 kit」，不声称与 React 像素级一致。

## 路由与导航（MUST）

包内若存在 `sitemap.yaml`，它是信息架构与路由的**唯一来源**。

1. 改 sitemap 的同一轮必须同步：侧栏菜单、顶栏页签槽与跨页入口、包根 `index.html`（PRD 汇总仍可用）。页签由壳层脚本按已打开页面生成，不要在业务页手写面包屑。  
2. 禁止只改 HTML 菜单或只改 sitemap。  
3. `planned` / 无 path：菜单灰显，勿链 404。  
4. 勾选表见 `skills/proto-spec-generator/references/handoff.md`。

## 产出检查清单

### 通用（各分支凡动到业务页都查）

- [ ] 截图或模糊需求已先按 `skills/proto-spec-generator/references/fuzzy-clarify.md` 确认结构项，再写入 Spec；未同意不得写业务页
- [ ] 新建/业务方案变更页已通过本批 Spec 确认；版本、页面范围与 `docs/spec-review.md` 依据相符（或有用户明确豁免）；小改不重复确认
- [ ] 若本包需独立打开：存在 `kits/ob-static`、`kits/proto-spec-runtime`、`kits/proto-mock`（已复制；勿重复 init 覆盖）
- [ ] `page.id` 符合 `{entity}-{pageType}`，与 Spec 文件名 / frontmatter / path 一致
- [ ] 页型符合 `layouts/` + `components/`（业务组合符合 `biz-page/`）；有表单时载体符合 `form-carrier.md`
- [ ] 本轮涉及页有 `proto-spec/<page-id>.md`，且 mount 含 `pageId` + `specBase` + sitemap/changelog/prd（见 `references/mount-snippet.md`）
- [ ] Spec：字段按用途拆表；关键交互含条件/成功/失败/影响；产品要求与原型覆盖已分开
- [ ] 包根 `changelog.yaml` 已追加本轮实质变更；包根 `index.html` 为 PRD 汇总（若包有入口）
- [ ] 侧栏与 sitemap 对齐（本轮若改了 sitemap）；侧栏无非业务项；一级菜单可展开收起
- [ ] 无页内 Annotation；仅 `ob-*` / `ps-*`
- [ ] 用户可见文案符合 `references/copywriting.md`（无 Mock/原型机制露馅句）；表单占位与 affix / 禁用符合 `references/controls/input.md`；业务页无「重置数据」等原型专用按钮
- [ ] 要展示画面的地方用 `kits/ob-static/photos/`（最多 10 张压缩图，见 `references/controls/photos.md`），不要外链、状态点或另建图片目录
- [ ] FAB 三抽屉：说明可读；与更新记录、导航目录互斥
- [ ] 视觉约定：有父子层级的表用 `.ob-table--tree`（展开箭头在复选框左侧，见 `data-table.md`）；所有表格默认最左一列复选，勾选后底栏左侧为已选数量、取消和批量按钮，不要展开；名称与编号同列，编号用 `.ob-table-id` 灰字放在名称下、不另开列（见 `data-table.md`）；页头无默认副文本；详情返回在标题左侧图标按钮，`h1` 不含状态 Tag；列表筛选卡/列表卡无冗余标题；详情 `.ob-desc` 表格式（标签淡底、值列白；默认两列对；通栏项后仍保持完整描边，禁止 nth-child 去边；**字段顺序**按 `references/layouts/detail-descriptions.md`「字段摆放顺序」：身份→状态→分类→归属→度量→审计→通栏收尾，通栏后禁止再排短字段）；多 Tab 用 `.ob-card--tabs` 一体卡勿重复标题；详情内嵌表用普通 `.ob-card__body` 相对卡片留边，禁止 `--flush`；表上操作（含基本资料「编辑」）固定 `.ob-panel-toolbar` 左上方；详情编辑在**当前页**打开 Drawer，禁止跳回列表 `?edit=`；「前往」类按钮加 `.ob-btn--jump`；Modal/Drawer 关闭用空的 `.ob-modal__close` / `.ob-drawer__close`（X 图标，禁止「关闭」文本）；表单双列默认、可 `--3`；表格操作列横线对齐；**字段视觉全站**按 `references/components/table-field-visual.md` 区分普通属性/分类/状态（列表、详情描述、内嵌表同一套）；筛选字段符合 `references/components/filter-form.md`「筛什么」；查询区改关键字、枚举、数值范围或空间级联后不刷新列表，要点「查询」才生效；查询区数值区间用数值范围选择器（`references/controls/number-range.md`），不要把最小/最大直接铺在筛选行；表格同一列单位不变时只写表头（全角括号），单元格只写数值，单位随行变化才写进单元格，详情 `.ob-desc` 单位仍跟在数值后（见 `data-table.md`）

### 条件项（任务包含时才查）

- [ ] **含列表 CRUD 同一实体**：新增后列表可见；刷新后仍在（ProtoMock 持久）；删除后该行消失且详情入口不可再打开该条；操作按钮点击有明确成功/失败反馈（非无响应）
- [ ] **含 ≥2 页业务流**：按 Spec 走通一条跨页路径（参数/默认筛选与 Spec 一致）
- [ ] **全包交付（分支 A）**：包根 `index.html` 可经 http(s) 打开为 PRD 汇总；页内可按关键字找到本包页面/需求摘要
- [ ] **只写 Spec（分支 C）**：不要求 HTML/ProtoMock/汇总页可检索；要求需求拆解、sitemap 与 Spec 自检通过；可交付待确认稿，但不得声称可直接实现

## 参考文档

- **文案规范**：`references/copywriting.md`
- **输入控件**：`references/controls/input.md`
- **表单载体选型**：`references/form-carrier.md`
- **需求拆解子技能**：`skills/proto-spec-generator/SKILL.md`
- **模糊需求澄清**：`skills/proto-spec-generator/references/fuzzy-clarify.md`
- **标准 mount**：`references/mount-snippet.md`
- **Mock 交互**：`references/proto-mock.md` · `kits/proto-mock/`
- **原型说明协议**：`references/proto-spec/README.md` · `spec-template.md`
- **更新记录**：`references/proto-spec/changelog-guide.md`
- **布局 / 组件 / biz-page / 控件**：`references/layouts/` · `components/` · `controls/`
- **展示图片池**：`references/controls/photos.md`
- **PRD 汇总**：`references/prd-hub.md`
- `references/component-catalog.md` · `prd-template.md` · `package-structure.md`

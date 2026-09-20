---
name: pm-proto-generator
description: >-
  使用本仓库静态 kits 生成或维护自包含 PM 原型包，包含逐页 proto-spec、
  HTML 原型、旁路说明、导航与 PRD 汇总。适用于用户点名本技能、要求本体系
  静态原型或维护已有包；不因普通 PRD、Mock、图表或零散样式需求自动启用。
---

# PM-PROTO-GENERATOR

## 用途与边界

固定流程：**读取上游文档包 → proto-spec-generator 逐页生成 Spec → 本技能开发并验收原型。**

本技能负责静态 HTML 实现与演示验证。上游负责产品目标、信息架构、业务规则和页面方案；子技能负责接收、来源记录、本地映射与实现适配。不得重新拆需求、规划角色或替上游裁决业务冲突。资料不足时反馈具体缺口及影响，继续无依赖冲突的部分。

产物采用 OceanBase Design Token 的静态 `ob-static` kit、页面说明 Runtime，以及按需使用的 ProtoMock。无 React、无 npm 构建；包内复制 CSS/JS，使用静态服务器打开，说明和数据通过 fetch 读取。技术栈或交互能力不兼容时报告具体差异，不静默替换方案或把复杂功能伪装成已实现。

不适用于正式 React 产品开发、通用前端脚手架或只写普通 PRD。已有本体系包的细小修复仍可使用，但按最小范围执行。

## 任务入口

开始时依据用户意图选入口，不默认重建全包。

| 任务 | 执行范围 | 完成条件 |
| --- | --- | --- |
| 完整原型 | 接收文档包、生成逐页说明、补齐资源、实现就绪页面及包根汇总 | 本批核心流程可演示，页面说明和导航可用 |
| 增量更新 | 接收新版来源，沿用映射，定位受影响页面和依赖，只改本批 | 已有材料保留，变化可追溯，相关流程回归 |
| 只生成逐页 Spec | 调用 [子技能](skills/proto-spec-generator/SKILL.md)，交付接收记录、sitemap 和逐页说明 | Spec 阶段检查通过；不初始化 kits、不要求 HTML |
| 样式调整或实现修复 | 读取当前页及相关规则，按已有业务依据修正实现 | 不改变业务语义，验证修复点；发现业务变更转接新版输入 |

已有 HTML 需补说明时：先找现有上游依据；页面只能证明实现现状，不能当成已确认业务。记录观察结果和差异，缺失依据按子技能接收规则处理，不从 HTML 反推新的产品承诺。

## 工作流程

### 1. 接收结果

读取 `docs/spec-intake.md` 中本批范围、来源版本、授权依据、映射和就绪状态，以及本批逐页 Spec。首次接收或新版输入交给 [proto-spec-generator](skills/proto-spec-generator/SKILL.md)。旧包可读取已有 Spec 和 `docs/spec-review.md`，不强制迁移。

实现依据遵守 [接收就绪规则](references/proto-spec/review-gate.md)：不能只看 `confirmed`；已有明确授权继续使用，派生 Spec 不另设产品审批。页面虽已写成草稿，有业务冲突的内容仍不实施。放行部分必须可独立闭环，不依赖受阻的共享规则或导航决策。

来源快照保持原样；技术命名和唯一可推导的关系由子技能适配，不要求上游补英文键。上游未提及旧页面不等于删除。业务变更需新版上游依据，明确删页后才同步处理入口与文档，保留历史快照。

### 2. 检查包资源

实现前检查目标目录的 sitemap、Spec、现有 HTML 和 kits。初始化或补资源使用：

```bash
python3 scripts/init_prototype.py prototypes/<slug> --name <slug>
```

脚本只补缺失文件，已有 Spec、sitemap、HTML、日志及 kit 文件不覆盖。新包无示例业务页。需要升级已有 kit 时单独评估差异，不能把初始化当升级。目录及资源前缀见 [包结构](references/package-structure.md)。只生成 Spec 跳过本步骤。

### 3. 实现

按本批就绪 Spec 创建或修改 `pages/<page-id>.html`。沿用本地映射；新页 ID、文件名、Spec frontmatter 的 id、Runtime pageId 保持一致，旧包合法路径不强制重命名。

已确认的业务 Spec 优先于 kit 默认表现。未指定的通用视觉用 kit；不要为满足默认组件规则增加业务能力。明确不做批量操作的表格加 `.ob-table--no-select` 或 `data-table-no-select`，防止脚本自动补复选框；明确独立的编码列保持独立；占位抽屉不补提交或 CRUD。占位替换仅按接收记录中的明确新版依据执行。

按需选页型与组件，允许组合多个区域；同包保持既有壳层。页面引用包内 kits，复用 `ob-*` Token，不另造主题。不为凑齐官方组件目录批量扩展 kit。当前页必要的浅交互可薄补；复杂能力先说明限制，不能自行把已要求实现的交互改为占位。

原型运行数据由本技能落地：按接收记录的对象映射和固定业务场景生成种子，跨页使用相同实体标识、状态和关系。有可写流程时接 ProtoMock，不用静态行假装 CRUD；只展示或明确占位时不添加写操作。演示数据不能扩展角色、状态或规则，具体数据协议见 [ProtoMock](references/proto-mock.md)。本轮技能调整不修复其既有数据合并缺陷，发现受影响路径应如实记录。

### 4. 联调

业务页按 [标准挂载范例](references/mount-snippet.md) 接页面说明、更新记录、导航目录与 PRD 入口。浮层和 Tab 属于宿主页面，页面说明使用 `proto-spec/<page-id>.md`，frontmatter 保留 `id/name`；兼容旧嵌套格式，不批量重生成。

完整包的 `index.html` 使用 mountPrdHub 聚合现有说明，可选 `docs/prd.md` 只作包级概述，不再抄一份业务真相。原型覆盖情况回写派生说明或接收记录，与产品要求、真正未决事项分开。

**只有导航变化才同步导航**：依据派生 sitemap 更新受影响侧栏、跨页入口和顶栏页签槽，检查汇总页仍可用。本地 sitemap 是路由实现依据，其业务依据仍在上游。planned 或无可用 HTML 的页面不能链接到 404；导航目录不替代业务侧栏。页签由壳层生成，不在各业务页手写另一套导航。

### 5. 验收

先按本批范围运行结构检查，再通过静态服务器走通实际场景：

```bash
python3 scripts/check_page_prd_sync.py prototypes/<slug> --stage prototype --page-id <本批页面ID>
```

多页重复传 `--page-id`；整包检查可省略。只生成说明使用 `--stage spec`，允许无 HTML。脚本检查文件与映射，不替代业务就绪判断或浏览器验收；错误须修复，不能靠改状态绕过。

验证一条完整跨页路径，检查对象、参数、返回关系与固定演示对象一致；有写操作则验证成功、失败和关联页面反馈。检查当前页说明可读、导航可用、更新记录和说明抽屉互斥。对本批新增字段、禁用操作、占位、无批量等例外逐项核对。详细项目按 [实现检查](references/implementation-checklist.md) 选择适用项。

## 关键约束

- 真实中文业务文案；业务界面不暴露 Mock、localStorage 等机制。演示专用能力默认通过旁路入口；若上游明确指定可见提示或控件，按其要求实现并记录。
- 不添加页内 Annotation 打点。说明在旁路 Drawer，浮层写在宿主 HTML 与宿主 Spec。
- 只改实现的修复不倒改产品要求；只改 Spec 不要求修改 HTML。业务变更与覆盖差异分别记录。
- 本批实质变更更新包内 `changelog.yaml`；技能自身变化记录根 `CHANGELOG.md`，两者不混用。
- 不覆盖、清空用户已有材料或 Mock 存储来掩盖兼容性问题。保留历史来源和映射；不因缺页自动删旧记录。

## 按任务读取参考资料

只加载本批需要的规则，不要求实现者通读整套规范。以下视觉细则均为上游未指定时的默认值。

| 何时读取 | 资料 |
| --- | --- |
| 首次接收、新版输入、来源或就绪不清 | [子技能](skills/proto-spec-generator/SKILL.md)、[交接](skills/proto-spec-generator/references/handoff.md) |
| 初始化、补资源、路径问题 | [包结构](references/package-structure.md) |
| 编写或修正逐页说明 | [说明协议](references/proto-spec/README.md)、[逐页模板](references/proto-spec/spec-template.md) |
| 页面结构与壳层选型 | [布局](references/layouts/README.md)、[组件目录](references/component-catalog.md)，按索引选具体页型 |
| 表单及弹窗/抽屉 | [表单载体](references/form-carrier.md)、[控件目录](references/controls/README.md)，按控件选文档 |
| 列表与详情字段 | [数据表](references/components/data-table.md)、[字段视觉](references/components/table-field-visual.md)、[详情](references/layouts/detail-descriptions.md) |
| 筛选、业务文案 | [筛选](references/components/filter-form.md)、[文案](references/copywriting.md) |
| 固定场景和可写数据 | [Mock](references/proto-mock.md) |
| 挂载说明与汇总 | [mount](references/mount-snippet.md)、[PRD 汇总](references/prd-hub.md) |
| 演示图片或新增记录 | [图片池](references/controls/photos.md)、[更新记录](references/proto-spec/changelog-guide.md) |
| 完成验证 | [实现检查](references/implementation-checklist.md) |

## 完成标准

交付时说明本批已实现与受阻页面、验证结果及剩余限制，给出可打开的原型入口或仅 Spec 的交付位置。完整原型须自包含、关键业务路径可演示、逐页说明与导航可读；增量任务只要求相关范围回归；Spec 任务须来源可追溯、映射稳定、依赖和就绪边界清楚。

实现者应能凭本批接收结果与按需参考完成工作，无需重新做产品决策。

# Phase 0～8 · 分步骤门闩

> 改编自产品静态包立项节奏；**资产与路径以本仓库为准**（`ob-static` / `proto-spec-runtime`），不使用 Axure 对照工程或 PageHelp 文件名。

## 确认口径（全 Phase 共用）

| 需要人确认 | 不要用人确认占门闩 |
| --- | --- |
| 阻塞的范围/业务规则问题、本批 sitemap 范围与各页 Spec 的实现确认 | 目录是否已建、`kits/` 是否就位、资源能否读到（脚本/列目录检查即可） |

已确认材料直接复用；阶段结束给短进度摘要即可，**禁止**每个 Phase 都强制停一次口头确认。

## Phase 0 · 立项

- 确定项目代号 `{CODE}`（如 `FZZQ`）与包目录名（推荐 `prototypes/<slug>/`，slug 可用 `{CODE}` 小写或业务名）
- 确认模块/端划分：PC 端 / 后台 / 移动端 / 大屏（可多选）
- 确认是**新项目**还是**增量**（增量 → 必须先读已有 `sitemap.yaml`）
- **门闩**：仅当代号 / 端 / 新·增量仍有未决时才停人确认；材料已齐则直接进入 Phase 1

## Phase 1 · 基础资产（包骨架）

**仅当目标目录尚无 `kits/`** 时执行初始化（**复制 kits，不编译 CSS**）：

```bash
python3 <skill-repo>/scripts/init_prototype.py prototypes/<slug> --name <slug>
```

已有包：跳过 init，复用现有骨架。

得到（或已存在）：

```text
prototypes/<slug>/
  kits/ob-static/           # 从技能仓库复制
  kits/proto-spec-runtime/
  kits/proto-mock/
  index.html
  sitemap.yaml
  changelog.yaml
  docs/prd.md · prd.html · req-breakdown.md · menu-plan.md
  pages/                    # 空
  proto-spec/               # 空
```

- 业务页引用**包内** `../kits/...`；**禁止**直链 skill 目录或只依赖仓库根 kits 而不 vendoring  
- 控件/布局规范仍读技能仓库 `references/`（文档，不必复制进包）  
- **检查（非人确认门闩）**：用列目录/脚本确认包路径存在且 `kits/` 已就位  

不在本阶段生成全量 HTML 业务页。

## Phase 2 · PRD 内容骨架

按仓库 `references/prd-template.md` 填（md/html 均可），建议保留锚点：

| 锚点 | 内容 |
| --- | --- |
| 页头 | 系统名、DOC_VERSION、日期、维护人 |
| `#version` | 首条版本记录（如 V0.1） |
| `#intro` | 背景、目标、用户角色 |
| `#design` | 色彩/布局说明（对齐 OB Token；旁路 Spec 规范一句话） |
| `#flow` | 关键流程入口（可链到各页 Spec 交互/状态节） |
| `#integration` | 外部系统对接 + 本系统接口（无则写「暂无」） |
| `#pages` | 两行说明：完整清单以 `sitemap.yaml` 为准 |
| `#glossary` | 术语（可占位） |
| `#environment` | 部署/信创等（可占位） |
| `#appendix` | 环境访问地址（与 environment 区分；可占位） |

- 本阶段产出 **`docs/prd.md` 骨架**即可；可打开的 **`docs/prd.html`** 由交接后的 `pm-proto-generator` 落地（本技能可生成占位 html，但不代替画原型阶段的汇总完善）。
- **门闩**：背景与角色仍有未决时人过目（允许粗）；已齐可跳过

## Phase 2.5 · 需求拆清

输入是截图或模糊需求时，**先**按 [fuzzy-clarify.md](./fuzzy-clarify.md)，使用 [统一确认稿格式](./confirmation-format.md) 交功能定位、结构草稿和关键业务字典并一轮确认（最多八个影响方向、骨架或关键业务含义的问题）。人未同意前不写 Spec、不写业务页。材料已经结构化则跳过，直接复用。

按 [req-breakdown.md](./req-breakdown.md) 输出短表（可落 `docs/req-breakdown.md` 或仅对话确认）：

1. **问题 vs 方案** + 本包范围 / 不做  
2. **角色 × 场景** → 实体 + 候选页（含拟定 page-id）  
3. **首批 P0/P1 页**清单（供 Phase 5）  

- 先完成「场景表 + 首批页」，再规划菜单；可将两者合并评审，阻塞范围问题才提前单独确认  
- 不做长文分析报告 / 功能清单 Excel / 验收标准大文档  
- 增量：只补新增场景行 + 增补建议表，见主技能「增量需求」

## Phase 3 · 站点地图

1. **以 Phase 2.5 候选页为输入**，完成 **菜单栏目规划表**（[menu-plan.md](./menu-plan.md)）→ 纳入本批评审；表中须含拟定 **page-id**  
2. 映射 L1/L2/L3；`pages[]` **只登记菜单末级对应的功能明细子页面**  
3. 填写完整 `sitemap.yaml`（[sitemap.md](./sitemap.md)）：每个 `pages[].id` = `{entity}-{pageType}`（如 `tenant-list`）  
4. 设置 `hideInPrdPageList`（设计/内部说明类）  
5. 每页：`id` / `name` / `status` / `version` / 建议 `layout` / 推荐 `path: pages/{id}.html`  
6. `docVersion` 与 PRD 一致  
7. 范围明确则继续准备本批 Spec；范围有阻塞歧义先提交具体方案确认  

**地图可与本批 Spec 一并确认；未确认材料只能用于准备草稿，不能据此实现业务页。**

增量：先按 req-breakdown 补场景行，再输出「增补建议表」（含拟定 page-id），可与受影响页 Spec 一并确认。

## Phase 4 · 设计文档（可选）

仅当用户要独立设计说明时，在 `docs/` 下增加 md，例如：

- `docs/design/changelog.md`
- `docs/design/basics.md`
- `docs/design/flows.md`

非必须；业务流程 / 状态细节优先写在各页扁平 Spec（`proto-spec/<page-id>.md` 的状态转换表与交互节），**不要**再要求每页单独 `flow.md`。

## Phase 5 · 本批核心 Spec【实现前硬门闩】

从 Phase 2.5 的 **P0（及必要 P1）** 清单选择一条完整核心流程涉及的页面，例如：

- 1 个后台列表页（标杆）
- 1 个详情或表单页
- （可选）1 个大屏/统计页（layout: chart-overview）

为每页生成 `proto-spec/<page-id>.md`（协议见仓库 `references/proto-spec/spec-template.md`，**不要**默认四分册）。  
建议 `layout` 写入 sitemap 该页字段，供后续原型技能使用。  
有实质内容则按 changelog-guide 追加包根日志。

- **门闩**：提交站点地图、页面清单、本批各页完整 Spec 和问题/假设；人工确认本批后，记录 `docs/spec-review.md` 再交接实现。详见 [确认规则](../../../references/proto-spec/review-gate.md)。抽检少量页不能放行未确认页；本批不必等待整站 Spec 完成。

## Phase 6 · 其余页面 Spec

- 按 sitemap 为其余页生成 Spec（`status: draft` 可）
- 暂不实现的页：sitemap 标 `status: planned`，可只写极简 `proto-spec/<page-id>.md`，或在 sitemap 注明
- 其余批次重复 Phase 5；保持 sitemap 与 Spec 的评审语义一致，禁止将地图确认等同于全部页面 Spec 确认

## Phase 7 · 发版前

- [ ] PRD `#version` 已经人确认（若本轮维护了 PRD）  
- [ ] 相关页 sitemap.`version` 已更新  
- [ ] `changelog.yaml` 已追加本版（勿改写历史条目）  
- [ ] `#pages` 与 sitemap 明细一致  
- [ ] `#integration` / `#environment` 已评审或显式「暂无」  
- [ ] 无自动递增版本号（只由人定）  
- [ ] 附录地址至少占位策略已说清  

## Phase 8 · 交付说明

向研发/测试/下一技能说明：

1. 打开包内 PRD 与 `sitemap.yaml` 理解范围  
2. 各页 Spec 由旁路「原型说明」在**后续静态页**中挂载 Runtime 阅读  
3. 请使用 **`pm-proto-generator`** 仅按有确认依据的本批 sitemap + Spec 生成/补齐 HTML（见 [handoff.md](./handoff.md)）  
4. 交接时列明**已有产物**（kits / sitemap / Spec / prd.md|html），下一技能**只补缺**，禁止重复 init  
5. 视觉以 OB Token 静态 kit 为准，不以第三方线框工具为唯一真相  

---

## 阶段对照（与用户提供的 Axure 流程）

| 原 Phase 要点 | 本技能落点 |
| --- | --- |
| 拷贝 admin/page-help 等 assets | 引用仓库 `kits/`，不拷 skill 私有 CSS 名 |
| sitemap.js + PageNav | `sitemap.yaml`；导航由后续原型壳层消费 |
| PageHelp 全 Tab | `proto-spec` **默认单 Tab「页面说明」** + Runtime（旧四分册包仅兼容） |
| generate-shells 壳页 | 交给 `pm-proto-generator` 或后续脚本，本技能只标 `planned` |
| FAB 三按钮 | Runtime **已实现**说明 / 更新记录 / **导航目录**三抽屉 |

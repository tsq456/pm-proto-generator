---
name: proto-spec-generator
description: >-
  在写静态原型之前，将用户需求拆清（角色×场景→页候选→P0）后再建 sitemap 与各页 proto-spec（对接 proto-spec-runtime）。
  截图或模糊需求须先按统一确认稿格式，一轮确认功能定位、结构项与关键业务字典，再写入 Spec。
  分步骤构建/增量增补 sitemap；产出可被 pm-proto-generator 消费的 Spec 与 PRD 骨架。
  在用户提到需求拆解、sitemap、页面地图、proto-spec 生成、增量需求补页、
  截图/模糊需求先澄清，或「先出规格再画原型」时使用。
disable-model-invocation: true
---

# Proto Spec Generator

## 定位

本技能在 **写业务 HTML 原型之前** 承接需求：

1. **模糊输入先澄清**功能定位、结构项与关键业务字典（[fuzzy-clarify](references/fuzzy-clarify.md)），再拆清角色×场景 → 页候选 / P0（[req-breakdown](references/req-breakdown.md)）
2. 分步骤确认信息架构 → **`sitemap.yaml`**
3. 按页产出 **`proto-spec/<page-id>.md`**（供 `kits/proto-spec-runtime` 渲染）
4. 可选包级 PRD 骨架；**不**在本技能内铺全量高保真页（交给 `pm-proto-generator`）

与 Runtime 的契约：默认每页 `proto-spec/<page-id>.md`（frontmatter + 正文）+ 包根 `changelog.yaml`，协议见仓库 `references/proto-spec/`。

## 何时用 / 何时不用

| 用 | 不用 |
| --- | --- |
| 新项目从 0 拆需求、定 sitemap、出 Spec | 已有 confirmed Spec，只改某一控件样式 |
| 增量需求：在**已有 sitemap** 上判断新页挂哪 | 用户只要改一句文案、不改结构 |
| 为后续 `pm-proto-generator` 准备输入 | 代替 Runtime 改 JS/CSS |

与主技能任务分支对应：本技能覆盖主技能的 **C. 只写 Spec**，以及 **A/B** 中「尚无 sitemap/Spec」的前置段。

## 强制阅读（按需）

| 任务 | 打开 |
| --- | --- |
| **向用户提交确认材料**（澄清 / 增量 / Spec 评审） | [references/confirmation-format.md](references/confirmation-format.md) |
| 全流程阶段门闩 | [references/phases.md](references/phases.md) |
| **模糊需求**（截图/口述；写 Spec 前一轮确认） | [references/fuzzy-clarify.md](references/fuzzy-clarify.md) |
| **需求拆清**（角色×场景→页候选→P0）再进菜单 | [references/req-breakdown.md](references/req-breakdown.md) |
| sitemap  schema / **page.id 命名** / 增量遍历 | [references/sitemap.md](references/sitemap.md) |
| 菜单规划表 → L1/L2/L3 → pages[]（含拟定 page-id） | [references/menu-plan.md](references/menu-plan.md) |
| 单页 Spec 写法（**新项目唯一必读模板**） | 仓库 `references/proto-spec/README.md` + `spec-template.md` |
| 交互节写法参考（写入同一 md，勿另建文件） | 仓库 `references/proto-spec/interaction-template.md`（章节范例） |
| 更新记录 | 仓库 `references/proto-spec/changelog-guide.md` |
| 交给原型技能 | [references/handoff.md](references/handoff.md) |

**旧四分册**（business/fields/flow/interaction 分文件）仅在维护旧包时按需打开 `references/proto-spec/README.md`「旧模板」；**禁止**把四模板当作新项目必读。

禁止通读无关工程；禁止把 FZZQ / Axure 的 `page-help`、`admin.css` 等资产名照搬进本仓库包（本栈用 `ob-static` + `proto-spec-runtime`）。

## 执行总流程（门闩）

```text
Phase 0 立项（代号、端、新/增量）   → 人确认：范围类未决点
Phase 1 包骨架 + sitemap 空壳      → 工具检查 kits/路径；不占人确认门闩
Phase 2 PRD 骨架章节               → 人过目背景/角色（可粗；材料已齐可跳过口头确认）
Phase 2.5 需求拆清（短表）         → 模糊输入先 fuzzy-clarify；再角色×场景 + 首批 P0 页
Phase 3 菜单规划表 → sitemap 填满  → 明确范围；有阻塞歧义先确认，否则继续准备 Spec
Phase 4（可选）设计/流程说明 md
Phase 5 本批核心流程 proto-spec   → 【硬门闩】完整材料经人工确认后，才可交接实现本批页面
Phase 6 其余页 Spec（可 draft）    → 分批重复 Phase 5，不阻塞已确认批次实现
Phase 7 发版前清单
Phase 8 交付说明 → 提示启用 pm-proto-generator（查缺补齐，勿重复 init）
```

**输入是截图或模糊需求时，先走 [fuzzy-clarify](references/fuzzy-clarify.md)，人同意结构草稿后才写 Spec。**  
**先完成 Phase 2.5（或复用等价材料），再规划 sitemap；可合并准备评审材料，不逐阶段强制确认。**  
**未通过本批 Spec 人工确认：禁止生成该批业务 HTML / Mock；仅 sitemap confirmed 不足以放行。澄清稿本身也不是实现授权。**  
实现前必读仓库 [确认规则](../../references/proto-spec/review-gate.md)，记录范围、版本与确认依据。  
细节与检查项见 [phases.md](references/phases.md)、[fuzzy-clarify.md](references/fuzzy-clarify.md)、[req-breakdown.md](references/req-breakdown.md)。

## 增量需求（MUST）

1. 定位包根，**先读现有** `sitemap.yaml`（无则问人路径）。
2. 新需求若是截图或模糊描述，先按 [fuzzy-clarify.md](references/fuzzy-clarify.md) 只澄清本轮变更的结构项；再按 [req-breakdown.md](references/req-breakdown.md) 补角色×场景行 → 候选页 / 拟定 page-id（可很短）。
3. 按 [sitemap.md](references/sitemap.md) **遍历** groups/pages：同名/同职责页？挂到哪条 L2？新建 L2 还是 children？
4. 输出「增补建议表」，可与受影响页 Spec 一并评审（拟挂载路径、**page-id=`{entity}-{pageType}`**、页型、影响面）。
5. 准备 sitemap 变更草案与**新增/变更页** Spec，按本批确认规则评审；通过后记录确认再交接实现。已有具体授权直接复用；`changelog.yaml` 按 guide 追加。  
6. 若包内已有原型页：在交接或同轮中明确 **导航/index 须与新 sitemap 对齐**（见 `pm-proto-generator`「路由与导航 MUST」）。

**page.id**：Phase 2.5 / Phase 3 / 增量建议表阶段就必须按 [sitemap.md](references/sitemap.md) 定稿（例：`tenant-list`、`tenant-detail`）；禁止拖到画 HTML 再命名。

## 产出目录（本仓库约定）

```text
prototypes/<slug>/                 # 或用户指定目录
  sitemap.yaml                     # 站点地图（本技能主产物之一）
  changelog.yaml                   # 有实质变更即维护
  docs/
    prd.md                         # Phase 2 骨架；可打开的 prd.html 由 pm-proto-generator 落地
    req-breakdown.md               # 可选：Phase 2.5 确认稿
    menu-plan.md                   # 菜单栏目规划表（确认稿）
  proto-spec/
    <page-id>.md                   # frontmatter = 页 meta；正文 = 页面说明（默认唯一文件）
```

HTML 业务页、FAB mount 由后续 `pm-proto-generator` 完成；本技能可在 Spec 旁备注建议 `layout`（见 `references/layouts/`）。

**初始化：** 仅当目标目录尚无 `kits/` 时执行 `init_prototype.py`。已有包则复用，禁止覆盖式重跑。

## 单页 Spec 生成顺序

与仓库协议一致：写 **`proto-spec/<page-id>.md`**（见 `references/proto-spec/spec-template.md` + `README.md`）。  
顺序概要：页面概述 → 功能范围（含**产品要求 / 原型覆盖**）→ 角色与权限 → 页面结构 → 字段说明（按用途拆分）→ 业务规则（含适用的状态流转）→ 交互说明（关键操作逐项写全）→ 验收要点 → 待确认事项；技术演示机制可置于末尾。  
**新需求：Spec 驱动后续原型**；补说明与差异裁决见 proto-spec `README.md`。  
默认**不要**再建每页子目录或四分册。

## 与人协作

- 提交确认材料前必读 [confirmation-format.md](references/confirmation-format.md)，统一章节、表头、依据标签、问题编号与回复方式；功能定位、结构、关键字典同轮呈现，不增加固定审批轮次。

- 材料不齐先问：产品名/代号、端（PC/后台/移动）、角色、是否已有 sitemap、首批优先页。模糊业务输入不在这里逐条问，走 [fuzzy-clarify.md](references/fuzzy-clarify.md) 一轮（最多 6～8 个结构问题）。
- Phase 2 后：模糊输入先确认结构草稿，再按 [req-breakdown.md](references/req-breakdown.md) 出角色×场景与 P0 页，然后进 Phase 3。
- **人工确认只用于未决的：结构项、范围、关键业务规则、核心页方案 / Spec。** 已确认材料直接复用；目录是否存在、`kits/` 是否就位用工具/脚本检查，**不占确认门闩**。禁止把结构项拆成多轮逐条确认。
- 阶段结束可给短进度摘要（变更了什么）；仅当本批实现确认尚未取得或存在阻塞未决点时才停下来确认，禁止「每一 Phase 都强制口头确认」拖慢。
- 禁止臆造业务规则；未知产品问题写「待产品确认：…」；原型未做写「原型覆盖：未演示」，二者勿混用。

## 自检

- [ ] 确认稿符合 confirmation-format；先有理解与建议，再集中列待决问题，未把澄清确认当作实现确认
- [ ] 截图或模糊需求已按 fuzzy-clarify 确认功能定位、结构项与关键业务字典后再写 Spec；未同意只留对话草稿
- [ ] Phase 2.5：已有角色×场景表 + 首批 P0 页，作为本批评审材料（已有确认可复用）
- [ ] sitemap 仅含明细子页面；模块名未当作 pages[] 条目
- [ ] 每个 `page.id` 符合 `{entity}-{pageType}`（如 `tenant-list`）；与 `proto-spec/<id>.md` 文件名 / frontmatter `id` 一致
- [ ] 增量已遍历旧 sitemap 并写明挂载点
- [ ] 每页有 `proto-spec/<page-id>.md`；字段分表、关键交互完整度、产品/演示已分开（见 proto-spec README）
- [ ] 已记录本批 Spec 的范围/版本/人工确认依据；未确认批次仅交付草稿，不放行业务页实现
- [ ] 交接说明已指向 `pm-proto-generator`（见 handoff）；并写明已有产物，避免对方重复 init

---
name: proto-spec-generator
description: >-
  接收上游模块、页面 Spec 与相关 IA 文档包，核对来源和实现依据，建立本地映射，
  派生 sitemap 与逐页 proto-spec，交给 pm-proto-generator 实现静态原型。
  用于上游文档转逐页说明、批量接收页面规格或新版 Spec 增量适配；
  不负责从模糊需求规划业务，不替上游确认产品决策。
disable-model-invocation: true
---

# Proto Spec Generator

## 职责

**读取上游文档包 → 生成逐页 Spec → 交接主技能开发原型。**

输入是用户提供的文件或粘贴正文；Notion 等链接可作来源记录，不自动同步远端内容。链接指向的必要正文未包含在文档包时，列为缺失输入，不凭链接标题推断需求。上游原稿是业务依据；本地逐页说明是带来源的派生材料，不另建产品审批。

只做接收核对、技术映射和逐页转换。不重新澄清产品目标、拆业务模块、设计导航或创造权限与状态规则。仅有模糊需求时反馈所需上游材料，不启动旧需求生成流程。

## 工作流

1. **读取文档包**：识别索引与唯一正文，读取本批页面 Spec、模块规则、相关 IA 及直接依赖。按批保留原稿；只读取影响本批的内容，不审查整个项目。使用 [接收记录](references/intake.md)。
2. **核对实现依据**：记录版本、确认依据和完整/增量范围；检查缺失、冲突、上游“需检查”影响及占位替换关系。按 [接收放行规则](../../references/proto-spec/review-gate.md)区分就绪与阻塞，不凭 confirmed 标签放行，不重复确认已有明确授权。
3. **建立本地映射**：复用现有页面、字段、状态与具名业务数据映射；缺技术标识时自行分配并记录，不退回产品补代码字段。按 [sitemap 与映射](references/sitemap.md)将已确认页面关系转换为本地路由，不改变业务结构。
4. **逐页生成 Spec**：使用 [逐页模板](../../references/proto-spec/spec-template.md)，一页一份 Markdown，抽屉/弹窗/Tab 归宿主。保留来源、权限、字段、操作结果、固定业务数据与验收；共享规则引用同一来源。阻塞内容保持草稿，不伪装成已定规则。
5. **交接主技能**：执行 [交接检查](references/handoff.md)，报告就绪页面、依赖闭环和阻塞页面。用户只要逐页 Spec 时到此结束；用户已要求原型时继续调用主技能，无需为格式转换再索取确认。

## 按任务读取

| 情况 | 必读资料 |
| --- | --- |
| 首次接收、来源/批次/版本记录 | [intake.md](references/intake.md) |
| 判断是否可实现、冲突反馈 | [review-gate.md](../../references/proto-spec/review-gate.md) |
| 页面、数据与技术标识映射 | [sitemap.md](references/sitemap.md) |
| 写逐页说明 | [协议](../../references/proto-spec/README.md)、[模板](../../references/proto-spec/spec-template.md) |
| 新版文档、受影响页、历史包 | [updates.md](references/updates.md) |
| 转入页面实现 | [handoff.md](references/handoff.md) |

## 产物与边界

包根保留 `docs/upstream/<batch>/` 原稿快照与一份 `docs/spec-intake.md` 接收记录；派生 `sitemap.yaml` 和 `proto-spec/<page-id>.md`。记录中集中维护来源版本、映射、范围、冲突、演示数据要求和占位替换，不另造业务 PRD。

- 只生成 Spec 时仅创建所需文档目录；不运行全包初始化、不复制 kits、不生成 HTML 或运行数据 JSON。
- 无业务歧义的技术命名、数据关联键和可唯一推导的路径可自动适配。对象同名但归属不明、状态含义或失败结果不明确属于业务缺口。
- 上游缺字段键、内部 ID 或英文枚举不是阻塞理由；中文业务语义必须足以唯一确定。
- 原型运行数据由主技能按固定业务场景落地，本技能只确定统一映射与数据要求。
- 已有授权和旧 `docs/spec-review.md` 可作为历史依据复用，不迁移旧包、不补造确认记录。
- 业务变更须有新版上游依据；不把直接业务修改请求当作重新规划需求的入口。

## 完成标准

来源可追溯；页面和浮层归属明确；技术映射稳定；逐页说明保留业务含义与验收；没有私自新增产品决策；就绪部分无阻塞依赖；草稿部分列出具体缺口及责任归属。

运行 `python3 <技能仓库>/scripts/check_page_prd_sync.py <包根> --stage spec` 检查文档对应关系。该检查不能代替来源和业务一致性核对。

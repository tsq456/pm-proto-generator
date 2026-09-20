# Proto Spec — AI 生成说明（主入口）

> **给 AI / Skill / Generator 用。** 生成或改写某页 Spec 时，以本文 + [spec-template.md](./spec-template.md) 为准。

## 何时使用

用户需要：页面说明、proto-spec、旁路说明 Drawer、或首次为原型页补全 Spec。

## Spec 与原型谁驱动谁（MUST）

按场景选一种；**禁止**默认「页面永远正确」。

| 场景 | 驱动关系 | 做法 |
| --- | --- | --- |
| **新需求**（尚无业务 HTML，或 sitemap/Spec 先行） | **Spec 驱动原型** | 按已确认需求写 Spec；本批 Spec 经人工确认后，`pm-proto-generator` 按确认版本实现页面。文案/按钮以 Spec 为准。 |
| **已有原型补说明** | 页面 → Spec 草稿 | 从页面提取**可见**行为写入 Spec；无法从页面验证的规则标「待产品确认：…」，**不得**因原型未做而把已确认需求改成待确认。 |
| **两者不一致** | 差异裁决 | 列出差异表（项 / Spec / 原型 / 建议改哪边）；由人确认后再改。**不能**默认改 Spec 去迁就 HTML。 |

对照一致性检查（按钮名、筛选字段、分区）在 **选定真相源之后** 做：

- 新需求 / Spec confirmed：不一致 → **改原型**（或标原型未覆盖，见下节）。
- 补说明且 Spec 仍为 draft：不一致 → 先问人，再改 Spec 或改页。

实现前必读 [本批 Spec 确认规则](./review-gate.md)。仅 sitemap confirmed 不代表页面 Spec 已确认；已有具体授权可复用，普通文案/样式小改不重复评审。

## 产品要求 vs 原型覆盖（MUST）

**未实现 ≠ 需求未确认。** 关键行为分开写三列（可放在交互节或能力表旁）：

| 维度 | 写什么 |
| --- | --- |
| **产品要求** | 正式产品应有的行为（给研发） |
| **原型覆盖** | `已演示` / `部分演示` / `未演示`（给评审：能点什么） |
| **待确认事项** | 仅真正未决的产品问题；勿把「原型没做错误态」写成待确认 |

示例：产品要求「从计划进任务列表时默认筛该计划」；原型覆盖「部分演示」；待确认「返回列表后是否保留原筛选」。

## 默认产出（扁平 · 每页 1 个文件）

```text
proto-spec/
  <page-id>.md          # 文件名 = page-id；YAML frontmatter + 正文 Screen Spec
```

例：`proto-spec/tenant-list.md`（**不要**用中文文件名；中文名写在 frontmatter `name`）。

- **`page-id`** = 文件名（无 `.md`）= frontmatter `id` = `{entity}-{pageType}`（sitemap 定稿）
- Drawer **默认单 Tab「页面说明」**（旧四分册包仅兼容，见文末）
- PRD 汇总读各页 `<page-id>.md`

### 旧包兼容

仍支持 `proto-spec/<page-id>/spec.md` 或 `meta.yaml` + 四分册。**新页一律扁平 `<page-id>.md`。**  
旧模板（`fields-template` / `flow-template` / `business-template` / `interaction` 四分册写法）**仅用于维护旧包**，不作为新 Spec 的并列必读。

## 生成前输入（缺则先问）

1. 场景：新需求 / 补说明 / 差异裁决（见上）
2. 页面名称与 `page-id`
3. 本页主任务（列表/表单/详情等）
4. 角色（至少 1 个）
5. 关键字段、状态、点击路径（新需求来自确认材料；补说明可从页面反推并标假设）

## 强制规则（MUST）

1. **默认只写 `proto-spec/<page-id>.md`**；frontmatter 含 `id` / `name`（建议 `version` / `status` / `updatedAt`）。
2. **正文是页面规格说明（Screen Spec）**：围着本页分区、控件、数据口径写；禁止空泛 PRD 套话。见 [spec-template.md](./spec-template.md)。
3. **字段用 Markdown 表**写在同一文件，并按用途拆表（表单 / 筛选 / 展示）；**不必**再写 `fields.yaml`。
4. **业务规则**建议 `{page-id}/BR-001`（页内可简写 `BR-001`，跨页或进 PRD 汇总时用带 page-id 的全称）；交互按控件/按钮书写。
5. **文案用真实中文业务语言**；未知产品问题写「待产品确认：…」；原型缺口写「原型覆盖：未演示」，二者勿混用。
6. **遵守上文「谁驱动谁」**；在真相源确定后，按钮名、筛选字段须与真相源一致。
7. **关键操作**（新建保存、删除、启停、提交、状态变更等）须写最低完整度：可操作条件 / 成功 / 失败 / 对数据与他页影响。查询、关闭、纯跳转可简写。写法参考 [interaction-template.md](./interaction-template.md)（**写入同一扁平 Spec**，勿另建 interaction.md）。
8. **涉及业务状态变化**时：状态流转规则表必填（流程图/Mermaid 仍可选）。见 [spec-template.md](./spec-template.md)。
9. **跨页跳转**写清：目标 `page-id`、传递的业务对象/参数、目标页默认条件、返回后筛选/分页是否保留（未知则待确认）。
10. **业务页禁止** `proto-anno`、数字角标、说明气泡。
11. **依赖静态服务器** `fetch`；`file://` 需 `inline.spec` / `inline.meta`。

章节命名、标题层级及内容分工以 [页面规格说明模板](./spec-template.md) 为准。权限集中维护；复杂操作分节；演示技术信息放在末尾。

## 推荐生成顺序

**新需求：**

```text
1) 确认 page-id、分区与已确认规则
2) 写 proto-spec/<page-id>.md（含产品要求 / 原型覆盖）
3) 提交 sitemap + 页面清单 + 本批 Spec，经人工确认后记录 docs/spec-review.md
4) pm-proto-generator 仅按已确认批次画页并 mount
```

**补说明：**

```text
1) 读现有 HTML + 已有 Spec（若有）
2) 提取可见行为；补产品规则与待确认
3) 标原型覆盖；差异列表交人确认
```

## Frontmatter 示例

```yaml
---
id: inspect-plan-list
name: 巡检计划列表
version: 1.0.0
status: draft
updatedAt: 2026-09-17
---
```

`status`：`draft` | `reviewing` | `confirmed` | `deprecated`。

## 页面接入

**唯一可复制范例**（含 kits 路径与必传 `pageId`）：仓库根 [`../mount-snippet.md`](../mount-snippet.md)。

包内 `pages/*.html` 使用 `../kits/...`（不要用本文旧示例里的多层 `../`）。抽屉 **打开 Spec**：复制绝对路径并尝试 `cursor://file/…`（详见 kit README）。

## 完成后自检

- [ ] 存在 `proto-spec/<page-id>.md`（无多余子目录）
- [ ] 文件名 === frontmatter `id` === sitemap `pages[].id`
- [ ] 已标明场景（新需求 / 补说明）；不一致处有差异说明或已按真相源对齐
- [ ] 字段已按表单/筛选/展示区分（本页用到的才写）
- [ ] 关键操作具备：条件 / 成功 / 失败 / 影响；产品要求与原型覆盖已分开
- [ ] 有状态变更则有状态流转表；跨页写清上下文
- [ ] 每条核心流程至少 1 条短验收例（正常或异常/边界）
- [ ] 页面已按 `references/mount-snippet.md` mount（含 `pageId`）；无 Annotation 打点

## 更新记录（外围）

包根 `changelog.yaml`；见 [changelog-guide.md](./changelog-guide.md)。

## 旧模板（仅兼容旧包 · 非新 Spec 必读）

| 文件 | 用途 |
| --- | --- |
| [business-template.md](./business-template.md) | 旧 business.md 文风参考 |
| [fields-template.md](./fields-template.md) | 旧 `fields.yaml`；**新页用 Markdown 拆表，勿再要求 YAML** |
| [flow-template.md](./flow-template.md) | 旧 flow.md；新页以状态流转表为准，Mermaid 可选 |
| [interaction-template.md](./interaction-template.md) | **现行**交互写法（扁平 Spec 内嵌）仍以本文为准 |

样例：`examples/proto-spec-demo/proto-spec/inspect-plan-list.md`。

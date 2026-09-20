# 交接给 PM-PROTO-GENERATOR

## 职责划分（MUST）

| 产物 | proto-spec-generator | pm-proto-generator |
| --- | --- | --- |
| `kits/` 初始化 | 仅当目标目录尚无 kits 时 init | 若已有则**禁止**再 init；缺失才补 |
| `sitemap.yaml` / 菜单规划 | 主责（含 Phase 2.5→3） | 消费；改 sitemap 须同步导航（见勾选表） |
| `proto-spec/<page-id>.md` | 主责（Spec 真相源） | 按 Spec 实现；差异交人裁决，勿擅自改规则 |
| `docs/prd.md` 骨架 | Phase 2 可写 | 可沿用为汇总顶部概述 |
| **包根** `index.html` PRD 汇总 | 可选占位 | **全包交付时落地/完善**（prd-hub） |
| `pages/*.html` + ProtoMock | 不生成业务实现 | 仅实现已确认批次 |
| mount Runtime | 不强制 | 主责（见标准片段） |

交接时先**列已有文件再补缺**，禁止子技能已 init 后主技能再跑一遍覆盖。

## 本技能结束时，包内应具备

- 已用 `scripts/init_prototype.py`（或等效）初始化，**或**包内已含 `kits/`（二者其一）
- Phase 2.5 需求拆清已确认（`docs/req-breakdown.md` 或对话等价记录：角色×场景 + 首批 P0）。若本轮输入曾是截图或模糊需求，结构项已按 [fuzzy-clarify.md](./fuzzy-clarify.md) 经人同意后再写入 Spec
- confirmed（或人认可的）`sitemap.yaml`（`page.id` 已按 `{entity}-{pageType}` 定稿）
- `docs/spec-review.md`：列明已确认批次的 page-id、Spec 版本、地图范围和真实确认依据；未确认批次明确标为待评审，不能直接实现
- 优先页完整 `proto-spec/<page-id>.md`（文件名 = sitemap id；**新需求场景下 Spec 为真相源**）
- `docs/prd.md`（包级概述）；包根 `index.html` 在画原型阶段落地为 PRD 汇总
- `docs/menu-plan.md` 确认稿
- `changelog.yaml`（若已有条目）

## 下一技能做什么

使用仓库根技能 **PM-PROTO-GENERATOR**（`name: pm-proto-generator`，`SKILL.md`）：

1. **查缺**：若已有 `kits/` / sitemap / Spec，复用并核对本批确认记录；文件存在不等于已获实现授权，不要重复 init  
2. **按已确认批次的 Spec + sitemap 实现** `pages/{page-id}.html`（新需求：Spec 驱动；勿为迁就空壳改写已确认规则）  
3. 壳层按 sitemap `shell` 选用 `app-shell` 或 `app-shell-multi`（同包一种）；类名 `ob-*`；控件 `references/controls/`；组合模式 `components/biz-page/`  
4. 每页按 **唯一标准片段**挂载（含必传 `pageId`）：

见仓库根 [`references/mount-snippet.md`](../../../references/mount-snippet.md)。摘要：

```js
ProtoSpecRuntime.mount({
  pageId: '<page-id>',
  specBase: '../proto-spec/',
  changelogUrl: '../changelog.yaml',
  sitemapUrl: '../sitemap.yaml',
  prdUrl: '../index.html',
});
```

5. 包根 `index.html` **即为 PRD 汇总**（`mountPrdHub`；全包交付必选）  
6. **路由 MUST**：以 `sitemap.yaml` 为唯一来源，按下方勾选表同步导航  
7. Spec 中「原型覆盖：未演示 / 部分演示」的项：实现时尽量补齐，或保持标注，**不要**把产品要求改成待确认  

## 导航 / 路由同步勾选表（改 sitemap 必做）

- [ ] 各业务页侧栏：末级 pages 与 `path` 一致（`deprecated` 按约定隐藏）；若 `shell: app-shell-multi`，顶栏 L1 与当前应用侧栏子树亦已同步；侧栏为可展开 `.ob-menu__group`、无非业务项
- [ ] `planned` / 空 path：灰显，不链 404
- [ ] 顶栏为 `.ob-page-tabs`（勿再写面包屑）；列表→详情、关联页入口与 `children` / path 一致；跨页参数与 Spec 一致
- [ ] FAB `prdUrl` → 包根 `../index.html`；勿把 PRD/包入口放进业务侧栏
- [ ] Runtime 导航抽屉用同一 `sitemapUrl`（不替代壳层同步）
- [ ] 本轮变更已记入 `changelog.yaml`
- [ ] 删页时已双向清理 sitemap + `proto-spec/<id>.md`（见 `check_page_prd_sync.py`）

## 交接话术（可直接贴）

```text
请按 PM-PROTO-GENERATOR（pm-proto-generator）技能，读取本包已有产物（勿重复 init）：
kits/、sitemap.yaml、proto-spec/、docs/prd.md、index.html。
读取 docs/spec-review.md，核对本批 page-id、Spec 版本、地图范围和确认依据；
只为通过人工确认的本批页面生成或补齐 pages/{page-id}.html，并按 references/mount-snippet.md
挂载 ProtoSpecRuntime（必传 pageId + specBase + changelogUrl + sitemapUrl + prdUrl）。
本包为新需求：以 Spec 为真相源实现页面；不要改写已 confirmed 的 Spec 业务规则；不要改 page.id；
未确认页先完成评审材料再请求确认；按 references/proto-spec/review-gate.md 执行。
布局按 sitemap.layout。Spec 里「原型覆盖」未演示的项尽量实现或保留标注。
全包交付须落地包根 index.html 为 PRD 汇总；侧栏与 sitemap 对齐（侧栏仅业务导航、可展开一级）；
完成 handoff 勾选表。验收按主技能「通用 + 条件项」清单。
```

## 边界

| proto-spec-generator | PM-PROTO-GENERATOR |
| --- | --- |
| 拆清 → 规划表 → sitemap → Spec | Spec + sitemap → 可点原型 |
| 不强制全量 HTML | 不重做页面地图讨论（若 sitemap 已确认） |
| Phase 0～8（含 2.5） | 主技能步骤 0～10 + **任务分支 A～D**（编号体系不同） |
| Spec 写清产品要求与待确认 | 实现并回填原型覆盖；差异交人裁决 |
| PRD md 骨架 | 全包交付时完善包根 `index.html` PRD 汇总 |

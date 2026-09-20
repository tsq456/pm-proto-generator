# 菜单栏目规划表

编写 `sitemap.yaml` **之前**必须先有（或共同整理）本表；可与 sitemap、本批 Spec 合并评审。

**上游**：输入是截图或模糊需求时，先完成 [fuzzy-clarify.md](./fuzzy-clarify.md)。若尚未做需求拆清，再完成 [req-breakdown.md](./req-breakdown.md)（角色×场景 → 候选页 → 首批 P0），然后填本表。本表消费拆清结果里的「候选页 / page-id」，按导航场景挂到 L1/L2/L3。

## 推荐流程

```text
⓪ 需求拆清（req-breakdown：场景 → 实体 → 候选 page-id）
① 菜单栏目规划表（纳入本批评审）
② 映射为 sitemap 的 L1 / L2 / L3
③ 每个菜单末级 → pages[] 一条明细子页面
④ 列表→详情等从属页 → children[]（或平铺 + note）
```

## 场景选择

| 场景 | 适用 | L1 | L2 | L3 |
| --- | --- | --- | --- | --- |
| **场景二** 单系统多用户 | 默认中后台 | 用户类型 | 功能模块 | 终端（跨端才拆） |
| **场景一** 多系统集成 | 多产品线 | 产品线 | 业务能力 | 用户×终端 |

## 场景二表头（抄到 docs/menu-plan.md）

| 用户类型 | 一级菜单 | 二级菜单 | 三级菜单（可选） | 页面名称 | 页面类型 | **page-id（拟定）** | 终端 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

- 用户类型 → sitemap **L1**
- 菜单域合并为 **L2**（必要时 L3=终端）
- **页面名称** → 明细页；**一行一页**
- **page-id**：按 [sitemap.md](./sitemap.md) 的 `{entity}-{pageType}` 在规划表阶段就填好（如 `tenant-list`），确认 sitemap 时不再改口
- **禁止**把「服务券管理」等模块名单独当成 pages 条目

## 场景一表头

| 产品线 | 业务能力（L2） | 用户类型 | 终端 | 页面名称 | 页面类型 | **page-id（拟定）** |
| --- | --- | --- | --- | --- | --- | --- |

## 页面类型（写入规划表 / sitemap.layout 建议）

与仓库 `references/layouts/` 对齐；**page-id 后缀**与类型对应。  
表单先定载体：[form-carrier.md](../../../references/form-carrier.md)。

| 规划表「页面类型」 | page-id 后缀 | 建议 layout id |
| --- | --- | --- |
| 列表 | `list` | list-filter-table |
| 整页表单（新建） | `create` 或 `form` | form-page |
| 整页表单（编辑） | `edit` 或 `form` | form-page |
| 抽屉表单 | `create` / `edit` / `form` | form-in-drawer |
| 弹窗表单 | 同上（或挂在 list 交互，不单开页） | form-in-modal |
| 详情 | `detail` | detail-descriptions |
| 结果 | `result` | result-page |
| 大屏/统计 | `dashboard` / `overview` | chart-overview |

完整公式与正反例见 [sitemap.md · page.id 命名](./sitemap.md)。

## Agent 话术示例

```text
先按 req-breakdown：角色×场景 → 实体与候选页（拟定 page-id）→ 首批 P0。
先完成需求拆解，再做菜单规划表和 sitemap 草案；可合并评审，业务页实现前确认本批 Spec。

场景二：L1=用户类型，L2=功能模块，pages[] 只登记菜单末级对应的功能明细子页面，
不要把模块名当页面名。每行拟定 page-id（如 tenant-list / tenant-detail）。
```

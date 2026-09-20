# Changelog 填写指南（给 AI / Generator）

> 包级更新日志是**原型外围能力**：只维护一个 `changelog.yaml`，由 Runtime「更新记录」抽屉读取。  
> **不要**写入业务页 DOM，**不要**塞进 `proto-spec/<page-id>.md` 正文当更新日志，**不要**用 `meta.extensions` 挂日志。

## 何时必须更新

在同一轮交付里，只要发生下列任一情况，就**追加**条目（不要改写旧条目）：

1. 新增 / 删除 / 重命名业务页（含 `page-id` 变更）
2. 修改某页 Spec（`business` / `flow` / `fields` / `interaction`）或对应业务 UI 的可见行为
3. 修改旁路层、壳层、多页联动、包级约定（与单一业务页无关）
4. 用户明确要求「记一笔更新记录」

无实质变更（纯错别字、未改含义的格式）可不记。

## 文件位置

```text
prototypes/<slug>/changelog.yaml    # 必有（可先空 package/pages）
examples/.../changelog.yaml         # 演示同约定
```

标准包内 `mount({ specBase: '.../proto-spec/', pageId })` 时，Runtime 默认拉取 `../changelog.yaml`。也可显式传 `changelogUrl`。

## 骨架（照抄后改）

```yaml
version: 1
updatedAt: 2026-09-17

labels:
  inspect-plan-list: 巡检计划列表

package: []

pages: {}
```

## 字段约定

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `version` | 是 | 协议版本，目前固定 `1` |
| `updatedAt` | 是 | 本文件最近一次写入日，`YYYY-MM-DD` |
| `labels` | 建议 | `page-id` → 中文页名；「全部」视图徽章优先用它 |
| `package` | 是 | 数组；包级 / 跨页 / 旁路 / 壳层改动 |
| `pages` | 是 | 对象；key 必须等于 `meta.page.id`（kebab-case） |
| 条目 `date` | 是 | `YYYY-MM-DD` |
| 条目 `summary` | 是 | 一行摘要，说清「这版做了什么」 |
| 条目 `items` | 建议 | 字符串数组，2～5 条要点；可空数组 |

## 写到哪一层

| 改动性质 | 写入 |
| --- | --- |
| 只影响某一业务页的 Spec / 页内交互 / 字段 | `pages.<page-id>` |
| 旁路 Runtime、包结构、多页导航、跨页规则、全局视觉壳 | `package` |
| 一次既改壳又改某页 | **拆成两条**：一条 `package` + 一条对应 `pages.<id>`（禁止同一事实复制两份长文） |

**一条事实只出现一次。**「全部」视图 = `package` ∪ 所有 `pages.*` 按 `date` 倒序合并；重复写入会在「全部」里双份显示。

## 抽屉如何展示（实现已约定）

- **本页**：仅 `pages[当前 page.id]`；工具栏提供**搜索文本**、**筛选日期**（日历对有记录日期标点）
- **全部**：项目所有历史（`package` + 全部页面条目）；工具栏提供**功能模块**（`项目` + 各 `labels`/`page-id`）、**筛选日期**（标点）、**搜索文本**
- 某 `page-id` 在 `pages` 中不存在或数组为空 → 本页空态「本页暂无更新记录」
- 不要为「占位」创建空的 `pages.<id>: []`，除非马上有条目
- 「功能模块」筛选项来自已有条目的 `package` / `pages.*`，无需在 YAML 另写模块表

## 追加步骤（Agent 按此执行）

1. 打开包根 `changelog.yaml`（没有则按骨架新建）。
2. 确认本轮涉及的 `page-id` 列表（与目录名 / `meta.page.id` 一致）。
3. 把今天的日期写入新条目的 `date`，并刷新根级 `updatedAt`。
4. 按上表决定写入 `package` 还是 `pages.<id>`（或两条）。
5. `summary` 用业务语言；`items` 写可验证的要点（改了哪个规则/字段/入口），禁止「优化体验」「做了一些调整」这类空话。
6. 若是新页，在 `labels` 补上 `page-id: 中文名`。
7. **只追加**到数组**最前面**（最新在上），不要改写、删除历史条目（除非用户明确要求勘误）。
8. 自检：`pages` 的 key 无拼写错误；没有把日志写进 Spec md 或业务 HTML。

## 合格示例

```yaml
version: 1
updatedAt: 2026-09-17

labels:
  inspect-plan-list: 巡检计划列表

package:
  - date: 2026-09-17
    summary: 旁路层上线更新记录能力
    items:
      - FAB「更新记录」打开独立抽屉，与原型说明互斥
      - 本页 / 全部 同一 changelog.yaml

pages:
  inspect-plan-list:
    - date: 2026-09-16
      summary: 巡检计划列表页首版 Spec
      items:
        - 补齐 BR-001～003 与启停交互
        - 字段 status / cycle 枚举
```

## 禁止

- 把更新日志拆成 `changelog/pages/*.md` 或多文件
- 用 JSON 作为默认书写格式（机器可读优先时仍以本 YAML 为准）
- 在 `meta.yaml` 的 `modules` / `extensions` 注册 changelog
- 在业务页放「更新记录」按钮或文案
- 用 `global` 表示「全部视图」的数据桶（数据桶叫 `package`；「全部」是 UI 合并结果）

## 与 Spec 生成的关系

推荐顺序：先改 Spec / 页面 → 再按本指南追加 changelog → 冒烟时点开 FAB「更新记录」看本页与全部。  
完整样例：`examples/proto-spec-demo/changelog.yaml`。

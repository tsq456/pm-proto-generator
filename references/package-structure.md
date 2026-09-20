# 原型包结构

## 位置

优先使用：

```
prototypes/<产品或功能-slug>/
```

slug 示例：`tenant-lifecycle`、`backup-policy`。

本仓库还提供：

- `examples/proto-spec-demo/` — 自包含示范（包内已有 `kits/`）
- 仓库根 `kits/` — **kits 源**（初始化时复制进包，不现场编译 CSS）

## 初始化（MUST）

用户说「用技能初始化目录 / 新建原型包」时：

```bash
python3 <skill-repo>/scripts/init_prototype.py prototypes/<slug> --name <slug>
```

脚本会：

1. 创建包骨架（`index.html`、`sitemap.yaml`、`changelog.yaml`、`pages/`、`proto-spec/`、`docs/`）
2. **把仓库根 `kits/ob-static`、`kits/proto-spec-runtime`、`kits/proto-mock` 复制到包内 `kits/`**

**不是**根据 kit「重新构建/生成」一套 CSS；kits 本身已是静态 CSS/JS，只需 **vendoring（复制）**。

Agent 若无法跑脚本，须等效执行：`cp -R <skill>/kits/ob-static <skill>/kits/proto-spec-runtime <skill>/kits/proto-mock <dest>/kits/`，并建好骨架文件。

## 入口页

`index.html` **即为 PRD 汇总首页**（`mountPrdHub`），不是业务列表墙，也不再单独列 kits/文档清单。可在顶栏提供「打开原型」链到默认落地页。

旧约定的「清单页 + docs/prd.html」已废弃；`docs/prd.html` 仅可作重定向到 `../index.html`。

## 交付

包已自包含时，**只传该包目录**即可（内含 `kits/`、`proto-spec/`、`docs/`、`pages/`）。用静态服务器打开包根。

## 命名

| 路径 | 用途 |
| --- | --- |
| `kits/ob-static/`、`kits/proto-spec-runtime/`、`kits/proto-mock/` | 初始化复制进来的静态资源 |
| `mock-data/*.json` | ProtoMock 实体种子 |
| `pages/{page-id}.html` | 业务页；`page-id` = `{entity}-{pageType}` |
| `proto-spec/<page-id>.md` | 该页 Spec（扁平单文件） |
| `changelog.yaml` | 包级更新记录 |
| `docs/prd.md` | 可选：包级概述（汇总顶部） |
| `index.html` | **必选** PRD 汇总首页 |
| `docs/req-breakdown.md` | 可选：Phase 2.5 需求拆清确认稿 |
| `docs/menu-plan.md` | 可选：菜单规划确认稿 |

## kits 相对路径（包内 vendoring 后）

| 文件 | 前缀 |
| --- | --- |
| 包根 `index.html` | `kits/...` |
| `pages/*.html`、`docs/*.html` | `../kits/...` |

升级视觉/Runtime：从技能仓库根再跑一次复制覆盖包内 `kits/`，并记 `changelog` package 条。

## 可贴在入口页的工程说明

> 本原型为静态 HTML，样式来自包内 `kits/`（对齐 OceanBase Design Token）。页面说明由旁路「原型说明」加载 `proto-spec/`。正式实现请使用 `@oceanbase/design` React 组件。

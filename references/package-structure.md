# 原型包结构

只生成 Spec 时交付 `docs/upstream/<批次>/` 原稿、`docs/spec-intake.md` 集中接收记录、`sitemap.yaml` 与 `proto-spec/<page-id>.md`，不复制 kits。

实现阶段运行 `python3 scripts/init_prototype.py prototypes/<slug>`。脚本可用于非空包，只补缺失文件；不会升级或覆盖已有 kit 文件。不能运行脚本时也按逐文件只补缺执行，不直接覆盖整个目录。升级资源属于单独变更，需检查差异并回归。

| 路径 | 用途 |
| --- | --- |
| `docs/upstream/<批次>/` | 不改写的上游原稿/粘贴快照 |
| `docs/spec-intake.md` | 来源、映射、范围、冲突、替换关系、就绪状态 |
| `docs/implementation-map.md` | 主技能维护的本批页型、布局、组件复用/新增与验收记录；Spec-only 不创建 |
| `sitemap.yaml` | 从已明确上游 IA 派生的本地页面与路由 |
| `proto-spec/<page-id>.md` | frontmatter id/name + 逐页说明 |
| `pages/<page-id>.html` | 本批原型业务页 |
| `kits/ob-static/`、`kits/proto-spec-runtime/`、`kits/proto-mock/` | 从仓库复制的静态资源 |
| `mock-data/*.json` | 主技能按固定场景生成的运行数据 |
| `index.html` | 完整原型包的 PRD 汇总，使用 mountPrdHub |
| `docs/prd.md` | 可选包级概述，不复制一套业务规则 |
| `docs/prd.html` | 兼容入口，重定向至包根汇总 |
| `changelog.yaml` | 原型包更新记录 |

新包没有预置业务页或需求拆解占位稿。已有文件与历史记录保持可读，不批量重生成。模板只定义格式，不构成业务依据。

包根资源前缀为 `kits/`，pages/docs 下为 `../kits/`；旧自定义路径按实际深度处理。完整包可独立传递，用静态服务器打开；新页采用扁平说明，旧嵌套说明继续兼容。

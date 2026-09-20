# PM-PROTO-GENERATOR

面向产品经理的 **Cursor Agent Skill**：在对话中生成**自包含静态 HTML 原型包**（视觉对齐 [OceanBase Design](https://github.com/oceanbase/oceanbase-design) Token），并附带旁路「原型说明」系统（`proto-spec` + Runtime），方便研发 / 测试 / 业务对齐。

仓库：[tsq456/pm-proto-generator](https://github.com/tsq456/pm-proto-generator)

## 能做什么

- 多页中后台线框（列表 / 表单 / 详情 / 弹窗抽屉 / 业务页模式）
- **无 React、无 npm 构建**；包内 vendoring `kits/`，可单独挂静态服务器
- 页级 Spec（业务 / 流程 / 字段 / 交互）+ FAB 三抽屉（说明 · 更新记录 · 导航）
- 子技能 `proto-spec-generator`：拆清（角色×场景→P0 页）→ `sitemap.yaml` → Spec，再画页面
- `page-id` 约定：`{entity}-{pageType}`（如 `tenant-list`）

## 仓库结构

```text
SKILL.md                      # 主技能 PM-PROTO-GENERATOR
skills/proto-spec-generator/  # 需求拆解子技能
kits/                         # kits 源（初始化时复制进原型包）
  ob-static/
  proto-spec-runtime/
scripts/init_prototype.py     # 新建自包含原型包
references/                   # 布局 / 组件 / 控件 / proto-spec 协议
examples/proto-spec-demo/     # 可运行示范（已含包内 kits/）
```

## 在 Cursor 中使用

**推荐安装位置（本机引用，不放进 Cursor 系统 Agent Store）：**

```text
/Users/tangsiqi/Documents/AI Skills/pm-proto-generator
```

1. 将本技能目录放到上述路径（或任意本地目录），在对话中用 **@ / 引用文件夹或 `SKILL.md`**，或说：`按 PM-PROTO-GENERATOR skill …`。
2. **不要**再安装到 Cursor 内置 Agent Store；本技能已从系统 Store 移除，改为路径引用。
3. **先判定任务分支**（见主 `SKILL.md`）：新建全包 / 增量改页 / 只写 Spec / 补页说明；禁止默认全包。
4. **新项目（全包）**：缺 kits 才 init → `proto-spec-generator` **Phase 2.5 拆清** → 站点地图 + 页面清单 + 本批 Spec → 人工确认并记录范围/版本 → 按批画页面（见 `references/proto-spec/review-gate.md`）；标准 mount 见 `references/mount-snippet.md`。

触发已收窄：仅「本静态原型体系」交付，见主 `SKILL.md` 适用/不适用。

### 初始化自包含包

```bash
python3 scripts/init_prototype.py prototypes/<slug> --name <slug>
```

会在目标目录创建骨架，并把仓库根 `kits/ob-static`、`kits/proto-spec-runtime` **复制**到包内 `kits/`（不编译 CSS）。

### 本地预览示范包

```bash
# 在仓库根或直接对示范包目录起静态服务
npx --yes serve examples/proto-spec-demo
```

浏览器打开入口，进入「巡检计划列表 → 详情 → 任务列表」。须用 **http(s)**，不要用 `file://`（Spec 依赖 `fetch`）。

## 原型包内路径（vendoring 后）

| 文件 | kits 引用 |
| --- | --- |
| `index.html` | `kits/...` |
| `pages/*.html`、`docs/*.html` | `../kits/...` |

单独部署时：**只上传该原型包目录**即可（含 `kits/`、`proto-spec/`、`docs/`、`pages/`）。

## 关键约定（速查）

| 主题 | 说明 |
| --- | --- |
| 需求拆清（进 sitemap 前） | `skills/proto-spec-generator/references/req-breakdown.md` |
| 模糊需求澄清（写 Spec 前） | `skills/proto-spec-generator/references/fuzzy-clarify.md` |
| page-id | `skills/proto-spec-generator/references/sitemap.md` |
| 布局 / 组件 | `references/layouts/`、`references/components/` |
| 业务页模式 | `references/components/biz-page/` |
| Spec 协议 | `references/proto-spec/README.md` |
| 更新记录 | `references/proto-spec/changelog-guide.md` |
| 包结构 | `references/package-structure.md` |

## 与正式实现的关系

本仓库产出的是 **PM 交付用静态原型**（Token 级视觉 + 可交互说明）。正式产品应使用 `@oceanbase/design` React 组件实现，不要把本仓库 CSS 当作生产依赖。

## License

未另行声明时，仅供内部 / 协作原型使用；对外开源许可可按需补充。

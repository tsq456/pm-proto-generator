# pm-proto-generator

使用静态 HTML 和仓库内 kits 创建可交互的产品原型，附逐页说明、导航与 PRD 汇总。

**上游文档包 → proto-spec-generator → 逐页 Spec → pm-proto-generator → 原型与验收。**

## 使用

- 完整原型：提供上游模块说明、页面说明及本批必要依赖，说明要实现的范围。
- 增量：提供新版资料和目标包；沿用既有映射，仅更新受影响内容。
- 只生成 Spec：接收文件或粘贴正文，保留来源快照；不需要初始化 HTML 或 kits。
- 样式或修复：指出现有包与修复点；业务变更需要新版上游依据。

无需上游提供英文字段键、技术 ID 或路由。子技能集中记录来源、版本、授权依据、映射与缺口；不会重新规划业务或自行解决上游冲突。不提供 Notion 自动同步。

## 入口

- [主技能](SKILL.md)：实现与验收。
- [接收子技能](skills/proto-spec-generator/SKILL.md)：五步接收与逐页转换。
- [交接协议](skills/proto-spec-generator/references/handoff.md)、[逐页模板](references/proto-spec/spec-template.md)。
- [包结构](references/package-structure.md)、[变更日志](CHANGELOG.md)。

## 工具

```bash
python3 scripts/init_prototype.py prototypes/my-app
python3 scripts/check_page_prd_sync.py prototypes/my-app --stage spec
python3 scripts/check_page_prd_sync.py prototypes/my-app --stage prototype --page-id asset-list
```

初始化只补缺失资源，保留已有文件；新包 sitemap 为空，不预置示例业务页。检查错误返回非零退出码。完整包通过静态服务器打开根 index.html，页面按需读取包内说明。

现有 Runtime、历史 Spec 和确认记录继续可读；不批量迁移旧包。示例位于 [examples/proto-spec-demo](examples/proto-spec-demo/)，历史演示不代表新版接收协议。

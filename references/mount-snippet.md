# 标准 mount 接入（唯一可复制范例）

> **所有文档引用本页。** 示例路径按**原型包内文件位置**写；禁止再写 `../../../kits/`、`../../../../kits/` 充当包内业务页路径。

## kits 前缀（与包结构一致）

| 文件位置 | kits / 相对资源前缀 |
| --- | --- |
| 包根 `index.html` | `kits/...` |
| `pages/*.html`、`docs/*.html` | `../kits/...` |
| 技能仓库 `references/` 里的示意片段 | 仅作控件骨架；**复制进包时**改成上表路径 |

## 业务页（`pages/{page-id}.html`）标准片段

```html
<link rel="stylesheet" href="../kits/ob-static/tokens.css" />
<link rel="stylesheet" href="../kits/ob-static/components.css" />
<link rel="stylesheet" href="../kits/proto-spec-runtime/proto-spec.css" />
<script src="../kits/proto-spec-runtime/proto-spec.js"></script>
<script src="../kits/proto-mock/mock-store.js"></script>
<script>
  ProtoSpecRuntime.mount({
    pageId: '<page-id>',                 // 必传；= proto-spec/<page-id>.md
    specBase: '../proto-spec/',
    changelogUrl: '../changelog.yaml',
    sitemapUrl: '../sitemap.yaml',
    prdUrl: '../index.html',
  });
</script>
```

必传字段：

| 字段 | 说明 |
| --- | --- |
| `pageId` | 与 sitemap `pages[].id`、Spec 文件名一致 |
| `specBase` | Spec 目录（扁平 md） |
| `changelogUrl` | 包根更新记录 |
| `sitemapUrl` | 导航目录抽屉 |
| `prdUrl` | 链到包根 PRD 汇总（`index.html`） |

可选：`workspaceRoot` / `specFileAbs`（本地「打开 Spec」）；`inline.*`（`file://` 内联，见 kit README）。

示范实现：`examples/proto-spec-demo/pages/inspect-plan-list.html`、`kits/proto-spec-runtime/README.md`。

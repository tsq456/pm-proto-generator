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

## 评审工具条（可选 · 演示权限场景）

需要演示「可写 / 只读 / 无权限」等差异时，通过 `demoPerspectives` 挂常驻评审工具条；**不要**做成业务页顶栏或侧栏控件。

- 工具条始终显示，不与说明 FAB 一起收起；可拖动，位置限制在视口内。
- 选项按 `group` 分组：`role`（角色）、`status`（状态）、`scenario`（权限场景）。某组无选项则不展示；只有一项则只显示当前值、不可下拉。
- 推荐用 **`scenario`（权限场景）** 表达权限效果，不绑定可变岗位名。例如：可维护、只读（含产权）、只读（无产权）、无模块权限。
- `demoPerspectiveActive` 可为字符串（兼容旧单值），或按组对象如 `{ scenario: 'writable' }`。
- 切换时由页面 `onDemoPerspective` 处理（通常写入演示态并刷新**当前页**）；**不要**为切换新增页面。

```js
ProtoSpecRuntime.mount({
  pageId: '<page-id>',
  specBase: '../proto-spec/',
  changelogUrl: '../changelog.yaml',
  sitemapUrl: '../sitemap.yaml',
  prdUrl: '../index.html',
  demoPerspectives: [
    { group: 'scenario', id: 'writable', label: '可维护', role: 'writable', title: '可查看，可写' },
    { group: 'scenario', id: 'readonly', label: '只读', role: 'readonly', title: '可查看，不可写' },
    { group: 'scenario', id: 'denied', label: '无模块权限', role: 'denied', title: '不可查看本模块' },
  ],
  demoPerspectiveActive: { scenario: 'writable' },
  onDemoPerspective: function (item) {
    // 写入页面约定的演示态并刷新当前页；勿新增页面
  },
});
```

说明 FAB（原型说明 / 更新记录 / 导航目录 / PRD 汇总）仍可侧边收起；与评审工具条相互独立。

示范实现：`examples/proto-spec-demo/pages/inspect-plan-list.html`、`kits/proto-spec-runtime/README.md`。

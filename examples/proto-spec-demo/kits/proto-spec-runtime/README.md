# 原型说明 Runtime

静态 HTML 旁路说明层：悬浮入口 + **三抽屉**（原型说明 / 更新记录 / 导航目录）。业务页不打 Annotation。

## 文件

| 文件 | 用途 |
| --- | --- |
| `proto-spec.css` | FAB、Drawer、更新记录、导航目录、PRD 汇总样式 |
| `proto-spec.js` | `ProtoSpecRuntime`（`mount` / `mountPrdHub`） |

## 页面接入

标准可复制片段见仓库根 **`references/mount-snippet.md`**（包内 `pages/*.html` 使用 `../kits/...`，必传 `pageId`）。

```html
<link rel="stylesheet" href="../kits/proto-spec-runtime/proto-spec.css" />
<script src="../kits/proto-spec-runtime/proto-spec.js"></script>
<script>
  ProtoSpecRuntime.mount({
    pageId: 'tenant-list',                // 必传 → proto-spec/tenant-list.md
    specBase: '../proto-spec/',
    changelogUrl: '../changelog.yaml',
    sitemapUrl: '../sitemap.yaml',
    prdUrl: '../docs/prd.html',
    // 本地预览「打开 Spec」用（任选其一）：
    // workspaceRoot: '/abs/path/to/this-prototype-package',
    // specFileAbs: '/abs/path/to/this-prototype-package/proto-spec/tenant-list.md',
    anchor: 'right-bottom',
  });
</script>
```

**必须用静态服务器打开**（`fetch` 读 md/yaml）。`file://` 可用 `inline.spec` / `inline.meta` / `inline.sitemap` / `inline.changelog`。

## Spec 目录（默认扁平）

```text
proto-spec/<page-id>.md   # frontmatter = 页 meta；正文 = 页面说明
```

旧 `proto-spec/<page-id>/spec.md` 与四分册仍兼容。详见仓库 `references/proto-spec/README.md`。

## 「打开 Spec」与目录

原型说明抽屉：

- 左侧常驻 **目录**（由正文 h1–h3 生成）；点击平滑滚动到对应标题
- 默认抽屉更宽（约 880px，可拖拽）；单 Tab 时隐藏顶部分页签
- 标题栏 **打开 Spec**：见下方

原型说明抽屉标题栏有 **打开 Spec**：

1. 解析绝对路径：`specFileAbs` → 或 `workspaceRoot`（或 `window.__PROTO_WORKSPACE_ROOT__` / `localStorage['proto-spec.workspaceRoot']`）+ `proto-spec/<pageId>.md`
2. **复制**绝对路径到剪贴板（浏览器禁止从 `http://` 打开 `file://`）
3. 尝试 `cursor://file/...`，稍后尝试 `vscode://file/...`

未配置根路径时：复制相对路径 `proto-spec/<page-id>.md` 并 Toast 提示配置 `workspaceRoot`。

一次配置示例（在包根静态服务下打开任意页后，控制台执行）：

```js
localStorage.setItem(
  'proto-spec.workspaceRoot',
  '/absolute/path/to/your-prototype-package'
);
```

## FAB

- 主按钮「原型说明」→ 说明抽屉；可拖动吸附
- **更新记录** → 独立抽屉（本页 | 全部）
- **导航目录** → 独立抽屉：按 sitemap **L1** 分组
- 三抽屉互斥

## 导航目录

- 数据：`sitemap.yaml`；`planned` / 无 path 不可跳转
- 可选 `hideInNav: true`

## 更新记录

见 `references/proto-spec/changelog-guide.md`。

## PRD 汇总页

```js
ProtoSpecRuntime.mountPrdHub({
  root: '#prdHub',
  sitemapUrl: '../sitemap.yaml',
  specBase: '../proto-spec/',
  packageBase: '../',
  packagePrdUrl: './prd-intro.md',
});
```

说明见 `references/prd-hub.md`。演示：`examples/proto-spec-demo/`。

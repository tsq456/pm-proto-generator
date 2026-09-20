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
    prdUrl: '../index.html',
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

## 「编辑文档」与目录

原型说明抽屉：

- 左侧常驻 **目录**（由正文 h1–h3 生成）；点击平滑滚动到对应标题
- 默认抽屉更宽（约 880px，可拖拽）；单 Tab 时隐藏顶部分页签
- 标题栏从左到右：**PRD 汇总**（配置了 `prdUrl` 时）、**编辑文档**、全屏、关闭。编辑文档和全屏之间有分割线。

**编辑文档** 打开本页说明文件：

1. 解析绝对路径：`specFileAbs` → 或 `workspaceRoot`（或 `window.__PROTO_WORKSPACE_ROOT__` / `localStorage['proto-spec.workspaceRoot']`）+ `proto-spec/<pageId>.md`
2. **复制**绝对路径到剪贴板（浏览器禁止从 `http://` 打开 `file://`）
3. 只唤起已选应用：`cursor://file/...`、`trae://file/...` 或 `vscode://file/...`。默认 Cursor。文本编辑器没有网页唤起方式，只复制绝对路径。

未配置根路径时：弹出「打开说明文件」。说明为：右键 `proto-spec` 的上一级并复制路径。同一弹窗可选择 Cursor、Trae、VS Code、文本编辑器。路径存在 `localStorage['proto-spec.workspaceRoot']`，应用存在 `localStorage['proto-spec.editor']`，同一主机和端口下共用。按钮右侧箭头里的「修改路径」可改这两项。

仍可用控制台写入同一个键（值为原型包根目录，不是网页地址，也不要写到 `proto-spec` 或某个 `.md`）：

```js
localStorage.setItem(
  'proto-spec.workspaceRoot',
  '/absolute/path/to/your-prototype-package'
);
```

## FAB

- 主按钮「原型说明」→ 说明抽屉；可拖动吸附
- **更新记录** → 独立抽屉（本页 | 全部）
- **导航目录** → 独立抽屉：sitemap **树形三列表**（页面名称 / 版本号 / 原型状态）
- **PRD 汇总** → 打开包根汇总页（配置了 `prdUrl` 时）
- `⌘K` / `Ctrl+K` 打开全文检索：按页面名称和说明正文搜索。上下键选择，回车打开原型页，点击打开 PRD 汇总中的对应页面
- 三抽屉互斥

## 导航目录

- 数据：`sitemap.yaml`；没有具体页面的分组用文件夹图标，有页面的用页面图标
- 列从左到右：**页面名称** · **版本号**（`version`）· **原型状态**（`status` → 草稿 / 可演示 / 已确认 / 待确认 / 未生成）
- `planned` / 无 path 不可跳转；当前页行高亮
- 可选顶层 `hideInNav: true`（子页仍可挂在父页下展示）

## 更新记录

见 `references/proto-spec/changelog-guide.md`。

## PRD 汇总页

使用包根 `index.html` 挂载 `mountPrdHub` 作为首页；标题行右侧全文检索；左侧目录与右侧正文同为外框。目录搜索铺满外框宽度，只有底部分割线，并固定在目录顶部。`docs/prd.html` 仅作兼容重定向。FAB「导航目录」仍为三列表格树，PRD 汇总入口在抽屉标题栏，不在搜索框旁。

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

## 页面规格说明阅读样式

正文采用连续白底，无内层卡片边框；页头集中显示版本、中文评审状态和更新时间。新 Spec 正文以二级章节、三级子节组织，兼容旧一级章节。目录默认显示前两层，更深内容可展开；字段表格保留轻量分隔，复杂操作按小节阅读。覆盖状态以轻量标签呈现，`> **阻塞确认**：…` 引用块突出显示。规范见 `references/proto-spec/spec-template.md`。

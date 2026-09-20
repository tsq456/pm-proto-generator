# PRD 汇总页（包级）

各页需求说明默认在 `proto-spec/<page-id>.md`。包级 **PRD 汇总** 读取 `sitemap.yaml`，聚合全部页面 Spec，并支持目录筛选与全文检索。

## 文件

```text
prototypes/<slug>/
  index.html          # **必选**包首页 = PRD 汇总（mountPrdHub）
  sitemap.yaml
  docs/
    prd.md            # 可选：包级概述（项目概述 / 总体说明）
    prd.html          # 可选兼容跳转 → ../index.html
  proto-spec/<id>.md
```

## 入口（MUST）

- **包根** `index.html` **即为** PRD 汇总首页（不再做业务页清单墙）。
- 顶栏/导航可链到默认业务页（如落地 list），**不要**再做单独的「kits / 文档清单」首页。
- **不要**在业务页 `.ob-sider` 里放「PRD 汇总 / 包入口」等非业务项（见 [chrome](./components/chrome.md)）。
- 旁路 FAB `prdUrl` 指向包根 `../index.html`；旧链 `docs/prd.html` 可保留为重定向。

## 接入（包根 index.html）

```html
<link rel="stylesheet" href="kits/ob-static/tokens.css" />
<link rel="stylesheet" href="kits/ob-static/components.css" />
<link rel="stylesheet" href="kits/ob-static/prototype.css" />
<link rel="stylesheet" href="kits/proto-spec-runtime/proto-spec.css" />
…
<div class="prd-hub__title-row">
  <h1>PRD 汇总</h1>
  <div id="prdTocMenu"></div>
  <div id="prdGlobalSearch"></div>
</div>
<div id="prdHub"></div>
<script src="kits/proto-spec-runtime/proto-spec.js"></script>
<script>
  ProtoSpecRuntime.mountPrdHub({
    root: '#prdHub',
    tocMenuRoot: '#prdTocMenu',
    globalSearchRoot: '#prdGlobalSearch',
    sitemapUrl: './sitemap.yaml',
    specBase: './proto-spec/',
    packageBase: './',
    packagePrdUrl: './docs/prd.md',
  });
</script>
```

- 跳过 `hideInPrdPageList: true` 与 `deprecated`
- 优先 `<page-id>.md`，否则回退 `<id>/spec.md` / `business.md`；皆无时显示空态
- 「打开原型页」使用 sitemap.`path`
- 左侧目录为**单页切换**（非长文锚点定位）
- 窄屏（≤960px）：目录收进标题右侧「目录」下拉，点击展开

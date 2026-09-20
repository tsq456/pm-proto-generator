# PRD 模板

用于编写 `docs/prd.html`（使用 `proto-doc` 样式），并可选同步为 `docs/prd.md`。

## 必含章节

1. **文档信息** — 产品 / 版本 / 作者 / 更新日期 / 状态（草稿|评审中|已定稿）
2. **背景与目标** — 为什么做；成功指标（可测）
3. **范围** — 范围内 / 范围外
4. **用户与场景** — 角色；主场景 3–5 条
5. **信息架构** — 页面清单与入口关系
6. **功能需求** — 按页面或按能力；每条带 ID（如 `REQ-01`）
7. **字段与校验** — 表格式：字段 | 类型 | 必填 | 规则 | 默认值
8. **状态与异常** — 列表空态、加载、失败、权限不足、并发冲突
9. **权限** — 谁可见 / 谁可操作
10. **非功能** — 性能、审计、兼容（浏览器）若相关
11. **里程碑与依赖** — 下游系统、设计 token/组件库依赖（`@oceanbase/design`）
12. **开放问题** — 未决项，避免假装已定

## HTML 骨架

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>PRD — …</title>
  <!-- docs/prd.html：相对包内 kits 为 ../kits/（见 references/mount-snippet.md） -->
  <link rel="stylesheet" href="../kits/ob-static/tokens.css" />
  <link rel="stylesheet" href="../kits/ob-static/components.css" />
  <link rel="stylesheet" href="../kits/ob-static/prototype.css" />
</head>
<body>
  <div class="proto-doc">
    <div class="proto-doc__nav"><a class="ob-link" href="../index.html">← 返回原型包</a></div>
    <article>
      <h1>…</h1>
      <p class="meta">…</p>
      <!-- sections -->
    </article>
  </div>
</body>
</html>
```

## 写作语气

- 精确、可测（如「管理员可在 3 步内创建租户」），不要营销腔。
- 用 `pages/{page-id}.html` 引用原型页（如 `pages/tenant-list.html`）。
- 标明静态原型**模拟**行为之处，与最终 React 实现区分。

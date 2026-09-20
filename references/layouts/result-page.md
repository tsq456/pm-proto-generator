# 结果页（Result）

对齐官方：`@oceanbase/design` Result（成功/失败/403 等）。

## 适用

- 提交成功、开通完成、无权限、流程结束页
- 关键词：结果、成功、失败、Result

## 区块结构

```
壳层（可简化：无复杂侧栏操作）
└─ .ob-content
   └─ .ob-card
      └─ .ob-result（图标语义文案 + 说明 + 按钮组）
```

## HTML 骨架

```html
<main class="ob-content">
  <section class="ob-card">
    <div class="ob-card__body">
      <div class="ob-result">
        <p class="ob-tag ob-tag--success">成功</p>
        <h2 class="ob-result__title">租户创建成功</h2>
        <p class="ob-result__desc">租户 prod-tenant-02 已创建，预计 2 分钟内完成初始化。</p>
        <div class="ob-result__actions">
          <a class="ob-btn ob-btn--primary" href="detail.html">查看详情</a>
          <a class="ob-btn ob-btn--default" href="tenant-list.html">返回列表</a>
        </div>
      </div>
    </div>
  </section>
</main>
```

失败态将标签改为 `ob-tag--error`，标题/说明写清原因与下一步。

## 约束

- 主按钮指向最可能的下一步（详情或重试）
- 错误页给出可行动作，避免只写「失败」

## 正式实现对照

`Result` + `status` + 额外操作区

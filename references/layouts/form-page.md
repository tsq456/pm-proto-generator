# 整页表单 / 分步向导

> 本文为上游未指定时的 kit 默认表现。已确认页面 Spec 的布局、列序、字段、交互与能力边界优先；不据此新增业务能力。

官方 CLI 无独立模板；对齐 PageContainer + Form，复杂配置/发布场景常用。

**组件级细则**：[form-page](../components/form-page.md)（分区、底栏、校验状态）；发布类组合见 [biz-page/sectioned-form](../components/biz-page/sectioned-form.md)；复杂控件见 `references/controls/`。

**选型**：[form-carrier.md](../form-carrier.md)（何时整页 vs 浮层）。

## 适用

- 字段多、需对照说明、或分多步完成的新建/编辑
- 关键词：整页表单、发布、向导、Steps、配置
- 日期 / 开关 / 级联 / 上传等控件：必须用 `references/controls/`，不要用原生系统控件冒充

## 区块结构

```
壳层
└─ .ob-content
   ├─ .ob-page-title（标题；主操作可放底栏）
   ├─ （可选）.ob-steps 分步
   ├─ .ob-stack → 一张或多张 .ob-card（分区表单）
   └─ .ob-footer-bar（取消 / 上一步 / 下一步或提交）
```

## HTML 骨架：分区整页表单

```html
<main class="ob-content">
  <div class="ob-page-title">
    <div>
      <h1>新建备份策略</h1>
    </div>
  </div>

  <div class="ob-stack">
    <section class="ob-card">
      <div class="ob-card__head"><div class="ob-card__title">基本信息</div></div>
      <div class="ob-card__body">
        <div class="ob-form-row">
          <div class="ob-field">
            <label class="ob-field__label"><span class="req">*</span>策略名称</label>
            <input class="ob-input" />
          </div>
          <div class="ob-field">
            <label class="ob-field__label"><span class="req">*</span>所属租户</label>
            <select class="ob-select"><option>请选择</option></select>
          </div>
        </div>
      </div>
    </section>

    <section class="ob-card">
      <div class="ob-card__head"><div class="ob-card__title">调度与保留</div></div>
      <div class="ob-card__body">
        <div class="ob-form-row">
          <div class="ob-field">
            <label class="ob-field__label"><span class="req">*</span>执行周期</label>
            <select class="ob-select"><option>每天</option><option>每周</option></select>
          </div>
          <div class="ob-field">
            <label class="ob-field__label"><span class="req">*</span>保留天数</label>
            <input class="ob-input" type="number" value="7" />
          </div>
        </div>
      </div>
    </section>
  </div>

  <div class="ob-footer-bar">
    <button type="button" class="ob-btn ob-btn--default">取消</button>
    <button type="button" class="ob-btn ob-btn--primary">提交</button>
  </div>
</main>
```

## HTML 骨架：分步（在页头下增加）

```html
<ol class="ob-steps">
  <li class="ob-steps__item is-done"><span class="ob-steps__num">1</span>基本信息</li>
  <li class="ob-steps__item is-active"><span class="ob-steps__num">2</span>调度配置</li>
  <li class="ob-steps__item"><span class="ob-steps__num">3</span>确认提交</li>
</ol>
```

底栏在非末步显示「上一步 / 下一步」，末步显示「提交」。

## 约束

- 相关字段按业务分区成卡，避免单卡超长滚动无锚点
- `.ob-form-row` 默认**双列占满**；字段短且同排 ≥3 项用 `.ob-form-row--3` 扩到三列；窄屏自动降列
- 表单行与行之间保持明显间距（kit：`--ob-space-600`）
- 页头默认无副文本
- 主提交在 `.ob-footer-bar`，不要只在页头放提交
- 条件字段（显隐）在交互说明与 PRD 字段表中写清

## 何时不用

- ≤8 字段且无强引导 → [form-in-modal.md](./form-in-modal.md) 或 [form-in-drawer.md](./form-in-drawer.md)

## 正式实现对照

`PageContainer` + `Form` +（可选）`Steps` + `FooterToolbar`

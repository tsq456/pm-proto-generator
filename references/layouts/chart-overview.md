# 概览 / 图表页

对齐语义：`@oceanbase/charts` + ChartProvider（正式实现）；静态原型用 KPI + 图表占位，不接真实图表库。

## 适用

- 运营概览、资源监控摘要、报表首页
- 关键词：图表、统计、KPI、Dashboard（非满屏大屏；大屏另议）

## 区块结构

```
壳层
└─ .ob-content
   ├─ .ob-page-title（标题 + 时间范围等操作）
   └─ .ob-stack
      ├─ .ob-kpi-grid（4 指标，可 2×2）
      └─ .ob-chart-grid
         ├─ .ob-card 图表 A
         └─ .ob-card 图表 B
```

## HTML 骨架

```html
<main class="ob-content">
  <div class="ob-page-title">
    <div>
      <h1>集群概览</h1>
    </div>
    <div class="ob-page-title__actions">
      <select class="ob-select" style="width:140px">
        <option>近 7 日</option>
        <option>近 30 日</option>
      </select>
      <button type="button" class="ob-btn ob-btn--default">刷新</button>
    </div>
  </div>

  <div class="ob-stack">
    <div class="ob-kpi-grid">
      <div class="ob-kpi">
        <p class="ob-kpi__label">租户数</p>
        <p class="ob-kpi__value">128</p>
        <p class="ob-kpi__hint">较昨日 +3</p>
      </div>
      <div class="ob-kpi">
        <p class="ob-kpi__label">告警中</p>
        <p class="ob-kpi__value">6</p>
        <p class="ob-kpi__hint">P1：1</p>
      </div>
      <div class="ob-kpi">
        <p class="ob-kpi__label">CPU 平均使用率</p>
        <p class="ob-kpi__value">62%</p>
        <p class="ob-kpi__hint">峰值 88%</p>
      </div>
      <div class="ob-kpi">
        <p class="ob-kpi__label">备份成功率</p>
        <p class="ob-kpi__value">99.2%</p>
        <p class="ob-kpi__hint">近 7 日</p>
      </div>
    </div>

    <div class="ob-chart-grid">
      <section class="ob-card">
        <div class="ob-card__head"><div class="ob-card__title">CPU 使用趋势</div></div>
        <div class="ob-card__body">
          <div class="ob-chart-placeholder" aria-label="折线占位">
            <span class="ob-chart-placeholder__bar" style="height:40%"></span>
            <span class="ob-chart-placeholder__bar" style="height:55%"></span>
            <span class="ob-chart-placeholder__bar" style="height:48%"></span>
            <span class="ob-chart-placeholder__bar" style="height:70%"></span>
            <span class="ob-chart-placeholder__bar" style="height:62%"></span>
            <span class="ob-chart-placeholder__bar" style="height:80%"></span>
            <span class="ob-chart-placeholder__bar" style="height:58%"></span>
          </div>
        </div>
      </section>
      <section class="ob-card">
        <div class="ob-card__head"><div class="ob-card__title">告警分布</div></div>
        <div class="ob-card__body">
          <div class="ob-chart-placeholder" aria-label="柱状占位">
            <span class="ob-chart-placeholder__bar" style="height:30%"></span>
            <span class="ob-chart-placeholder__bar" style="height:65%"></span>
            <span class="ob-chart-placeholder__bar" style="height:45%"></span>
            <span class="ob-chart-placeholder__bar" style="height:20%"></span>
          </div>
        </div>
      </section>
    </div>
  </div>
</main>
```

## 约束

- 指标口径写在 PRD / PageHelp（若有），原型上用 `__hint` 给一句话说明即可
- 占位图须标注「示例 / 占位」，勿假装真实可视化库
- KPI 一般 3–4 个；过多则拆第二行或下钻列表
- 正式实现需 `ConfigProvider` + `ChartProvider`，本原型不引入 charts 包

## 禁止

- 把满屏指挥舱大屏布局塞进普通 `.ob-content`（大屏需独立暗色规范）
- 用随机渐变装饰代替「有标题的指标/图表卡」

## 正式实现对照

`PageContainer` + 指标卡 + `@oceanbase/charts`（Line/Column/Pie 等）

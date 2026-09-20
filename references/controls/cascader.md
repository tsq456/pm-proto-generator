# Cascader（P0）

## 何时用

- 省 / 市 / 区、组织「公司 → 部门 → 组」、类目多级路径  
- 需要展示完整路径文案（如 `华东 / 杭州 / 西湖`）

**不要**用多层原生 `<select>` 横排冒充级联。

## 骨架

```html
<div class="ob-cascader" data-ob-cascader>
  <button type="button" class="ob-cascader__trigger">
    <span data-ob-cascader-label>请选择</span>
    <span class="ob-filter-trigger__caret" aria-hidden="true"></span>
  </button>
  <div class="ob-cascader__panel" role="listbox">
    <div class="ob-cascader__menus">
      <ul class="ob-cascader__menu">
        <li><button type="button" class="ob-cascader__item is-active">华东<span class="ob-cascader__arrow">›</span></button></li>
        <li><button type="button" class="ob-cascader__item">华北<span class="ob-cascader__arrow">›</span></button></li>
      </ul>
      <ul class="ob-cascader__menu">
        <li><button type="button" class="ob-cascader__item is-active">杭州<span class="ob-cascader__arrow">›</span></button></li>
        <li><button type="button" class="ob-cascader__item">宁波<span class="ob-cascader__arrow">›</span></button></li>
      </ul>
      <ul class="ob-cascader__menu">
        <li><button type="button" class="ob-cascader__item is-active">西湖</button></li>
        <li><button type="button" class="ob-cascader__item">滨江</button></li>
      </ul>
    </div>
  </div>
</div>
```

打开：根节点 `.is-open`。  
叶节点无 `.ob-cascader__arrow`。  
禁用项：`.is-disabled`。

## 交互（原型级）

- 点击触发器切换 `.is-open`
- 点击非叶：高亮并展示下一列（可用静态多列演示；`controls.js` 做开合即可）
- 点击叶：写入 trigger 文案（`/` 拼接），关闭面板
- 数据可用页面内 `data-*` 或注释中的 JSON；**不必**接真接口

## 定位 MUST

与 DatePicker / Filter 相同：`relative` 容器 + `absolute` 面板；注意 Drawer/`overflow` 裁切。  
右对齐：`.ob-cascader--align-right`。

## 与 Spec

路径型 `reference` / 自定义说明「多级选择」→ Cascader。  
仅两级且每级很少 → 可降级为两个 `.ob-select`，但须在 Spec 注明。

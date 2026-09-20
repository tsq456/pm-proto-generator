# TreeSelect（P1）

## 何时用

- 组织树、资源树中**选一个或少数字节点**写入字段  
- 需要树形展开，但不需要 Cascader 的「列式路径」

若只要固定三级路径，优先 [Cascader](./cascader.md)。

## 骨架

```html
<div class="ob-treeselect" data-ob-treeselect>
  <button type="button" class="ob-treeselect__trigger">
    <span data-ob-tree-label>请选择节点</span>
    <span class="ob-filter-trigger__caret" aria-hidden="true"></span>
  </button>
  <div class="ob-treeselect__panel">
    <div class="ob-tree">
      <div class="ob-tree__node is-expanded">
        <button type="button" class="ob-tree__switcher" aria-label="展开"></button>
        <button type="button" class="ob-tree__title">园区 A</button>
        <div class="ob-tree__children">
          <div class="ob-tree__node">
            <span class="ob-tree__switcher is-leaf"></span>
            <button type="button" class="ob-tree__title is-selected">1 号楼</button>
          </div>
          <div class="ob-tree__node">
            <span class="ob-tree__switcher is-leaf"></span>
            <button type="button" class="ob-tree__title">2 号楼</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

- 打开：`.ob-treeselect.is-open`  
- 展开：`.ob-tree__node.is-expanded`  
- 选中：`.ob-tree__title.is-selected`  
- 多选原型：title 前加 [Checkbox](./checkbox-radio.md)，并在 Spec 说明

## 交互期望

静态展开即可；`controls.js` 负责面板开合与点击标题写回 trigger。不必虚拟滚动。

## 定位 MUST

同 Filter / DatePicker。

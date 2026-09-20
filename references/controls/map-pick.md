# 地图选点（薄补）

地址不手填。点「地图选点」打开示意地图，在图上点一下生成地址，确定后回填只读输入框。正式产品对接地图 SDK；原型只演示选点 → 出地址。

## 何时用

- 园区、地块、楼栋等资产的地址
- 详情里「查看地图」：只看已有地址，不能改点

不要用普通输入框冒充地址，也不要做真实地理编码。

## 结构

```html
<div class="ob-field">
  <label class="ob-field__label">地址</label>
  <div class="ob-map-pick">
    <input class="ob-input" id="fAddress" readonly placeholder="请在地图上选点" />
    <button type="button" class="ob-btn ob-btn--default" data-ob-map-open="fAddress">地图选点</button>
  </div>
</div>
```

查看已有地址：

```html
<a class="ob-link" href="#" data-ob-map-view="福建省福州市长乐区滨海大道 18 号">查看地图</a>
```

开合与回填在 `controls.js`。弹层由脚本插入，业务页不必再写一套地图 Modal。

## 交互

| 步骤 | 结果 |
| --- | --- |
| 点「地图选点」 | 打开地图；未点过则地址为空 |
| 在图上点击 | 落针，并生成一条地址写入预览 |
| 确定 | 回填到 `data-ob-map-open` 指向的输入框 |
| 取消 / 关闭 | 不改原值 |
| 查看地图 | 只读，不能改点；无地址时轻提示 |

未选点就确定：轻提示「请在地图上选点」。

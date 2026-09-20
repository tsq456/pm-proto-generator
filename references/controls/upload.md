# Upload（P1）

按附件是不是图片，选两种控件。不要用同一个文件上传区混过去。

原型不真上传。点击可保持静态列表，或用 `ObToast` 提示。Runtime 旁路层的 `ps-toast` 不要混用。

## 文件上传

证照、图纸、导入文件、压缩包等非图片附件。

```html
<div class="ob-upload" data-ob-upload>
  <div class="ob-upload__dragger" tabindex="0" role="button">
    <div class="ob-upload__title">点击或拖拽文件到此处</div>
    <div class="ob-upload__hint">支持 .pdf .rar .zip，单个文件不能超过 5MB</div>
  </div>
  <ul class="ob-upload__list">
    <li class="ob-upload__item">
      <span class="ob-upload__name">权证扫描件.pdf</span>
      <span class="ob-upload__status">已添加</span>
      <button type="button" class="ob-link">删除</button>
    </li>
  </ul>
</div>
```

列表展示文件名，不展示缩略图。

## 图片上传

现场照片、封面、证件照等图片附件，必须用图片上传，不要用文件上传。

类名 `.ob-upload.ob-upload--picture`。已选图片用缩略图 `.ob-upload__thumb`，不要排成文件名列表。

```html
<div class="ob-upload ob-upload--picture" data-ob-upload>
  <button type="button" class="ob-upload__thumb">上传图片</button>
  <div class="ob-upload__hint">支持 .png .jpg .jpeg，单个文件不能超过 5MB</div>
</div>
```

多张时缩略图横排，每张可删除。格式说明只写图片后缀，不要带上 pdf、rar、zip。

缩略图和详情里要看见的画面，都用 [photos.md](./photos.md) 里的图片池，不要写「已上传」或外链。

## 状态

| class | 含义 |
| --- | --- |
| `.is-dragover` | 拖拽悬停（示意） |
| `.is-error` | 失败提示 |
| `.is-disabled` | 禁用 |

## 禁止

- 用无样式的 `<input type="file">` 裸露作为唯一界面（可隐藏 input，外观必须是 `ob-upload`）
- 图片字段用文件拖拽区或「上传附件」按钮
- 文件字段用图片墙
- 做真实上传请求

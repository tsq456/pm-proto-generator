# 展示用图片池

现场照片、封面、缩略图这类**要看见画面**的地方，共用同一套压缩图。重点是能显示图片，不要求画面和业务场景一致。

## 目录

每个原型包固定为：

```
kits/ob-static/photos/
  01.jpg
  02.jpg
  …
```

- 只放图片，最多 **10** 张。
- 页面引用包内路径，不要外链。`pages/` 下是 `../kits/ob-static/photos/01.jpg`。
- 按序号取用即可。同一页多张就连续取 `01`、`02`，不要为每个字段再下载一套。

## 抓取与压缩

从 Unsplash 随机取若干张，压成 JPEG（长边不超过 960，质量约 55），写入上面的目录。再跑一次会换掉原有图片。

```bash
python3 "<技能仓库>/scripts/fetch_photos.py" prototypes/<slug>
```

随机接口要登录时，改从 `images.unsplash.com` 抽几张公开图；仍失败才用 picsum（图源仍是 Unsplash）。压缩用 macOS `sips`，没有则用 Pillow。

## 怎么用

详情只读：缩略图横排，点击预览（`.ob-gallery` + `data-ob-preview`，开合在包内 `controls.js`）。

```html
<div class="ob-gallery" data-ob-gallery>
  <button type="button" class="ob-gallery__item" data-ob-preview="../kits/ob-static/photos/01.jpg" aria-label="照片 1">
    <img src="../kits/ob-static/photos/01.jpg" alt="照片 1" />
  </button>
</div>
```

上传区里已经选中的图片，缩略图同样用这个目录里的文件，不要只写「照片 1」「已上传 N 张」。上传控件本身见 [upload.md](./upload.md)。

## 禁止

- 用状态点、`已上传` 文案代替图片
- 手绘 SVG、纯色块冒充照片
- 页面里写 `https://images.unsplash.com/...` 之类外链
- 在 `photos/` 以外再放一套展示图
- 超过 10 张，或把图标、图纸缩略图塞进这个目录

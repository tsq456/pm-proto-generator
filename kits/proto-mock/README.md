# ProtoMock（原型 Mock 数据与可写交互）

静态 HTML 原型的 **mock 数据层**：跨页增删改查，变更写入 `localStorage`，刷新/跳转后仍保留。种子里新增的 id 会补进已保存的列表，已有记录不会被种子覆盖。

## 何时用

| 场景 | 必须 |
| --- | --- |
| 列表 ↔ 新建/编辑/详情 同一实体 | 是 |
| 新增后列表要出现新行；删除后列表要少一行 | 是 |
| 按钮「点击无反应」的业务动作（启用/停用/提交） | 是（改 store 再重渲） |
| 纯展示、无状态示意 | 可不接（但默认列表页应接） |

**不要**用写死的静态 `<tr>` 假装可交互 CRUD；**不要**用 `alert` 代替落库。

## 包内位置

```
prototypes/<slug>/
  kits/proto-mock/mock-store.js   # 初始化时 vendoring
  mock-data/
    tenants.json                  # 实体种子（可选，也可用 inline seed）
  pages/
    tenant-list.html
    …
```

## 引入

```html
<script src="../kits/proto-mock/mock-store.js"></script>
```

须用 **http(s)** 打开（`seedUrl` 需 `fetch`）。

## Bootstrap

```js
await ProtoMock.bootstrap({
  namespace: 'style-review',          // 包级命名空间，避免多包串数据
  entities: {
    tenant: {
      idKey: 'id',
      seedUrl: '../mock-data/tenants.json',
      // 或 seed: [ { id: '1', name: '…' }, … ]
    }
  }
});
```

| API | 作用 |
| --- | --- |
| `list(entity)` | 全部行（副本） |
| `get(entity, id)` | 单行 |
| `create(entity, record)` | 新增（自动补 id / createdAt） |
| `update(entity, id, patch)` | 更新 |
| `remove(entity, id)` | 删除 |
| `reset(entity)` | 恢复种子 |
| `queryParam(name)` | 读 URL 查询参数 |
| `escape(text)` | 插 HTML 前转义 |

监听变更：`window.addEventListener('protomock:change', (e) => { … })`。

## 页面接线约定（MUST）

### 列表页

1. `tbody` 初始可空或放占位；**就绪后用 JS 根据 `ProtoMock.list` 渲染**。
2. 行内「删除 / 停用」调用 `remove` / `update` 后 **立刻重渲**。
3. 「新增」跳转表单页或打开 Drawer/Modal；提交成功后 `create` 并跳回列表（或关浮层并重渲）。

### 新建 / 编辑表单

1. 提交按钮 `preventDefault`，校验必填后 `create` / `update`。
2. 成功：`location.href = 'entity-list.html'` 或关弹窗 + `dispatch` 重渲。
3. 禁止只 `console.log` / Toast 而不写 store。

### 详情页

1. `id = ProtoMock.queryParam('id')`，`get` 后填充 `.ob-desc`。
2. 编辑保存走 `update`，返回列表带同一 id。

### 空态

无数据时渲染 `.ob-empty`，带「去新建」主按钮。

## 种子 JSON 示例

`mock-data/tenants.json`：

```json
[
  {
    "id": "t-001",
    "name": "prod-tenant-01",
    "status": "running",
    "cluster": "ob-prod-01",
    "cpu": "16 C",
    "memory": "64 GB",
    "createdAt": "2026-03-01 10:00"
  }
]
```

## Agent 生成检查清单

- [ ] 包内有 `kits/proto-mock`（初始化已复制）
- [ ] 跨 ≥2 页的同一实体有 `mock-data/*.json` 或 inline `seed`
- [ ] 列表渲染来自 `ProtoMock.list`，不是写死行
- [ ] 新增 / 删除 / 编辑会改 store 并反映到列表
- [ ] `namespace` = 包 slug，避免污染
- [ ] 可在控制台调用 `ProtoMock.reset`；**禁止**在业务页放「重置数据」按钮
- [ ] 用户可见文案遵守 `references/copywriting.md`（确认框等不得露馅 Mock/原型机制；页上不放原型专用控件）

## 与 Spec

`interaction.md` 写清：本原型用 ProtoMock 模拟落库；正式实现对接真实 API。不必把 localStorage 写进 PRD 业务规则。

---

> 已确认上游 Spec 优先，本文提供未指定部分的默认规则。明确占位不补提交或 CRUD。
title: 表单载体选型（机读）
audience: AI / PM / 原型实现
scope: 业务表单用 Modal / Drawer / 整页承载；不含 ProtoSpec Runtime 旁路抽屉
---

# 表单载体选型

> **何时**用弹窗、抽屉或整页承载表单。画页前先读本文件，再打开对应 layout / overlay 骨架。  
> **怎么画**见：`components/overlay-ui.md`、`layouts/form-in-modal.md`、`layouts/form-in-drawer.md`、`components/form-page.md`、`components/biz-page/`。

## 一句话

| 形态 | 一句话 | layout / 模式 |
| --- | --- | --- |
| **Modal** | 确认、危险操作；或**用户明确要求**表单放弹窗 | `form-in-modal` |
| **Drawer** | 从列表进入的新增/编辑，要保留背后的列表 | `form-in-drawer` |
| **整页 form-page** | 长表单、多分区、分步向导，或本身是「创建/发布」主任务 | `form-page` |

**默认：业务表单放抽屉或整页，不放弹窗。** 只有用户当场说「放弹窗 / Modal」时，才把表单放进 Modal。确认框（删除、停用）仍用 Modal，那不是表单。

旁路 FAB「原型说明 / 更新记录 / 导航」是 **`ps-*` 系统抽屉**，**不是**业务表单载体。

---

## 决策顺序（MUST 按序问）

```
1. 只是确认 / 二选一（无业务字段或仅一句理由）？
   → Modal 确认框（默认宽 440）

2. 用户是否明确要求这个表单放在弹窗里？
   → 是：Modal 表单
   → 否：不要用 Modal 承载表单

3. 多分区 / 与详情镜像的大表单 / 发布类 / 分步 Steps？
   → 整页 form-page（提交在 .ob-footer-bar）

4. 其余新增、编辑（含档案页 / 详情页改基本信息）
   → 右侧 Drawer
   → **详情页编辑必须挂在当前详情 HTML 上打开**，不要跳回列表 `?edit=`，不要另开 edit 页
   → 再按下方「抽屉单列还是双列」定宽度

5. 想在 Modal/Drawer 里再套多步向导？
   → 禁止；升整页
```

字段数只帮助判断抽屉几列、要不要升整页，**不再**用来把表单送进弹窗。

---

## 抽屉单列还是双列（MUST）

抽屉里**最多两列**。需要三列或更多分区时，升整页，不要把抽屉拉成表格式三列。

| 判定 | 用 | 宽度 | 例子 |
| --- | --- | --- | --- |
| 字段少（大约 ≤6），多为名称、归属、负责人、一句备注，字段之间不成对 | **单列** `.ob-stack` | 默认 480px | 新增园区 |
| 字段大约 ≥8，或短字段自然成对（面积/租金、部门/负责人、类型/开关） | **双列** `.ob-form-grid-2` | `.ob-drawer--wide`（720px） | 新增地块、新增楼栋、新增房源 |
| 备注、地址很长、上传、子表、分区标题 | 占满一行 `.ob-field--full` | 随抽屉 | 关联资产、证书附件 |

双列不是为了把字段硬塞满。不成对的长文本仍然占满一行。单列抽屉不要加 `--wide`。

---

## 对照表

| 维度 | Modal | Drawer | 整页 |
| --- | --- | --- | --- |
| 典型字段量 | 不按字段数默认进弹窗；仅用户明确要求时 | 单列约 ≤6；双列约 ≥8 或字段成对 | 15+ 或强分区 / 三列需求 |
| 保留列表上下文 | 弱（居中遮罩） | **强**（侧滑） | 无（离开列表） |
| 保留列表上下文 | 弱（居中遮罩） | **强**（侧滑） | 无（离开列表） |
| page-id | 通常挂在 list/detail **宿主 HTML**，不另开页 | 同左；layout 可标 `form-in-drawer` | 常单独 `*-create` / `*-edit` / `form` |
| 多步向导 Steps | **禁止** | **禁止** | 允许 |
| 确认/危险操作 | 首选 | 少用 | 整页内再开 Modal 确认 |
| 只读短详情 | 可用 | 可用（可无脚） | 用 detail 页，不是表单页 |

---

## 场景速查

| 场景 | 用 | 不用 |
| --- | --- | --- |
| 删除 / 停用 / 启用确认 | Modal 确认框 | Drawer、整页 |
| 列表新增/编辑 | **Drawer**（单列或双列，见上表） | 未获明确要求时用 Modal |
| 详情页改基本信息 | **当前详情页打开 Drawer** | 跳回列表 `?edit=`、另开 edit 页、未要求时用宽 Modal |
| 商品发布 / 多卡价格+协议+步骤 | **整页** | Modal / Drawer |
| 驳回 + 一句理由 | Modal | 整页 |
| 用户明确说表单放弹窗 | Modal | — |
| 分步配置向导 | **整页** + `.ob-steps` | 浮层内 Steps |

---

## 与 sitemap / Spec

| 载体 | sitemap | Spec |
| --- | --- | --- |
| Modal / Drawer 表单 | 一般**不**新建 page；写在宿主页 layout 备注或 interaction | 宿主 `proto-spec/<host-id>.md` 写清触发区、字段、开关 |
| 整页表单 | 独立 page；`layout: form-page`；pageType 多为 `create` / `edit` / `form` | 独立 `proto-spec/<page-id>.md` |
| 档案编辑 | 宿主多为 `*-detail`；默认抽屉，不另发明 pageType | 仅用户明确要求弹窗时见 biz-page/profile-edit-modal |

menu-plan 中的 layout 名：`form-in-modal` · `form-in-drawer` · `form-page`。

---

## 硬禁止

1. Modal / Drawer 内再套多步向导 → 改整页  
2. 未获明确要求却把业务表单放进 Modal → 改 Drawer 或整页  
3. 抽屉里做三列 → 改双列或升整页  
4. 用 `alert` / `confirm` 代替 Modal  
5. 业务浮层用 `ps-*`（说明层专用）  
6. 列表 Filter 浮层冒充业务表单  
7. 双列字段塞进默认 480px 抽屉 → 加 `.ob-drawer--wide`  
8. 详情「编辑」跳回列表 `?edit=` 或另开 edit 页 → 改在当前详情页打开 Drawer  

---

## 实现指针（怎么画）

| 需要 | 打开 |
| --- | --- |
| 遮罩、尺寸、脚按钮、Toast | [components/overlay-ui.md](./components/overlay-ui.md) |
| 弹窗表单骨架 | [layouts/form-in-modal.md](./layouts/form-in-modal.md) |
| 抽屉表单/详情骨架 | [layouts/form-in-drawer.md](./layouts/form-in-drawer.md) |
| 整页分区、底栏、多卡 | [components/form-page.md](./components/form-page.md) · [layouts/form-page.md](./layouts/form-page.md) |
| 档案编辑 | 默认 [form-in-drawer](./layouts/form-in-drawer.md)；仅明确要求弹窗时 [profile-edit-modal](./components/biz-page/profile-edit-modal.md) |
| 分区发布整页 | [components/biz-page/sectioned-form.md](./components/biz-page/sectioned-form.md) |
| 界面文案 | [copywriting.md](./copywriting.md) |

---

## AI 自检

1. 是否先按「决策顺序」选了载体，而不是默认整页或默认 Modal？  
2. 从列表进入的表单是否用了 Drawer（未明确要求时不要用 Modal）？  
3. 抽屉是单列还是双列？双列是否加了 `--wide`？是否误用了三列？  
4. 浮层里是否出现了 Steps / 向导？  
5. 档案编辑是否误开了独立 edit 页，或在未要求时用了弹窗？  
6. 宿主 Spec 是否写清了抽屉触发、单列/双列与字段（未静默另开 page-id）？  
7. 详情页「编辑」是否在**当前页**打开抽屉，而不是跳回列表或 `?edit=`？

# 中后台控件规范（P0 / P1）

> 给 AI / Skill：生成业务页或旁路工具栏时，**复杂控件必须按本目录选型**，禁止临时发明一套日期/级联/开关样式。  
> 视觉与 class 落在 `kits/ob-static/components.css`；开合见 `kits/ob-static/controls.js`（与 `filter-dropdown.js` 并列引入）。

## 优先级

| 级 | 控件 | 分册 | 交付期望 |
| --- | --- | --- | --- |
| **P0** | DatePicker / RangePicker | [datepicker.md](./datepicker.md) | 完整骨架 + 日历面板 + 标点约定 |
| **P0** | Switch | [switch.md](./switch.md) | 完整骨架 + 开/关态 |
| **P0** | Checkbox / Radio | [checkbox-radio.md](./checkbox-radio.md) | 完整骨架 |
| **P0** | Cascader | [cascader.md](./cascader.md) | 触发器 + 多列面板 |
| **P1** | TimePicker | [timepicker.md](./timepicker.md) | 简化面板（时/分列） |
| **P1** | Upload | [upload.md](./upload.md) | 上传区占位 + 文件列表态 |
| **图片池** | 展示用照片 | [photos.md](./photos.md) | `kits/ob-static/photos/`，最多 10 张压缩图，全站复用 |
| **P1** | TreeSelect | [treeselect.md](./treeselect.md) | 触发器 + 树面板（静态展开） |
| **薄补** | 气泡卡片 | [popover.md](./popover.md) | 悬停展示标题和正文；归属路径用它看完整路径 |
| **基础** | Input / Select / Textarea（含前缀后缀、禁用） | [input.md](./input.md) | 占位文案 + affix + disabled |
| **筛选** | 数值范围选择器 | [number-range.md](./number-range.md) | 查询区数值区间。触发器同枚举筛选；禁止把最小/最大铺在筛选行 |

## 控件扩展口径（默认不扩 kit）

目标是讲清业务意图，**不是**把 `@oceanbase/design` 重做成 vanilla 组件库。

| 情况 | 做法 |
| --- | --- |
| 已有 P0/P1 分册能覆盖 | **必须**用本目录骨架 + `controls.js`，禁止另写一套样式/行为 |
| 按官方组件清单批量补齐（Steps/Transfer/Badge…） | **禁止**进 kit |
| 高复杂度 / P2（富文本、AutoComplete、远程 Transfer、完整 Upload、虚拟大树等） | **默认不做 kit**：`.ob-empty` / 文案占位，Spec 注明正式用 `@oceanbase/design` |
| 当前页演示刚需、交互浅（如三态 Segmented、本地勾选穿梭示意） | **允许薄补**：优先页内一小段 JS + 少量 `ob-*` CSS；若多页复用再升入 `components.css` / `controls.js`，并可选补一分册 |
| 薄补时 | 复用 Token 与现有 class 模式；不宣称与 React 像素级一致；不引入 npm/React |

## Spec 字段 type → 控件

| `fields.yaml` type | 默认控件 | 备注 |
| --- | --- | --- |
| `boolean` | Switch（设置项）或 Checkbox（表单多选语义） | 单独开关用 Switch |
| `date` | DatePicker | 禁止裸 `input[type=date]` 冒充 OB |
| `datetime` | DatePicker + TimePicker（或组合触发器） | 可拆两个字段 |
| `enum`（≤7 项） | Radio 或 Filter / Select | 筛选条用 Filter 面板 |
| `enum`（>7 项） | `.ob-select` 或 Filter 面板 | |
| 省市区 / 组织路径 | Cascader | |
| 树形单选/多选 | TreeSelect | |
| `file` | Upload | |
| `string` / `number` / `integer` | `.ob-input` | |
| `array` of enum | Checkbox 组 | |

## 浮层总规则（所有 Picker / Cascader / TreeSelect）

与 [component-catalog.md](../component-catalog.md)「Filter 浮层定位」相同，再强调：

1. 触发器容器 `position: relative`；面板 `absolute`，为触发器**直接兄弟**。
2. 祖先拆分滚动：触发器行 `overflow: visible`，只有结果列表滚动。
3. 开合 class：容器 `.is-open`；选中项 `.is-active`；禁用 `.is-disabled` / `disabled`。
4. 业务页引入：

```html
<!-- 包内 pages/*.html 使用 ../kits/（见 references/mount-snippet.md） -->
<script src="../kits/ob-static/filter-dropdown.js"></script>
<script src="../kits/ob-static/controls.js"></script>
```

5. 旁路 Runtime 内若自管点击：须 `stopPropagation`，避免与全局脚本双绑。

## 生成检查清单

- [ ] 未使用原生 `input[type=date|time]` / 系统 checkbox 无 class 充当主视觉（可用原生 input 隐藏，外观必须是 `ob-*`）
- [ ] P0/P1 控件 class 与对应分册骨架一致
- [ ] 未按官方目录批量扩 kit；若有薄补，仅服务当前演示刚需且交互浅
- [ ] 高复杂度控件为占位 + Spec，而非假完整实现
- [ ] 筛选场景的日期/级联遵守 overflow MUST
- [ ] Spec `type` 与上表映射一致
- [ ] 要展示的图片来自 `kits/ob-static/photos/`，不超过 10 张，见 [photos.md](./photos.md)

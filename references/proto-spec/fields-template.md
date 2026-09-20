# fields.yaml 模板（仅兼容旧包）

> **新 Spec 不要用本文件作必读。** 默认在扁平 `proto-spec/<page-id>.md` 内按用途拆 Markdown 表（表单 / 筛选 / 展示），见 [spec-template.md](./spec-template.md) 与 [README.md](./README.md)。  
> 仅当维护仍使用 `fields.yaml` 的旧四分册包时按本文书写。

## 骨架

```yaml
fields:
  - name: 计划名称
    code: planName
    type: string
    required: true
    default: null
    description: 当前巡检计划名称
    validation:
      maxLength: 50

  - name: 状态
    code: status
    type: enum
    required: true
    default: draft
    enum:
      - label: 草稿
        value: draft
      - label: 已启用
        value: enabled
      - label: 已停用
        value: disabled
      - label: 已结束
        value: ended
    description: 当前计划状态
```

`code` 仍写入 YAML（供交互/规则引用），**Drawer 字段表不展示编码列**。

## Runtime 展示列

| 字段名 | 类型 | 必填 | 默认值 | 枚举值 | 字段说明 | 校验规则 |
| --- | --- | --- | --- | --- | --- | --- |

- **不展示**「字段编码」
- **枚举值**：各 `label` 用 `/` 拼接直出，例如 `草稿/已启用/已停用/已结束`；无 Popover、「共 N 项」等二次点击

## 字段必填键（YAML）

| 键 | 要求 |
| --- | --- |
| `name` | 中文显示名 |
| `code` | camelCase，页内唯一（存档用，界面不展示） |
| `type` | 见下表 |
| `required` | 布尔，不得写成字符串 |
| `description` | 一句话 |

常用可选：`default`、`enum`、`validation`。

## type 枚举

`string` | `number` | `integer` | `boolean` | `date` | `datetime` | `enum` | `array` | `object` | `file` | `reference`

- `enum`：**必须**有非空 `enum: [{ label, value }]`；展示只用 `label`
- 校验示例：`validation.maxLength` / `min` / `max` / `pattern`
- **UI 映射**（生成页面时强制）：见 `references/controls/README.md`  
  - `boolean` → Switch 或 Checkbox  
  - `date` / `datetime` → DatePicker（+ TimePicker）  
  - `file` → Upload  
  - 多级路径 → Cascader / TreeSelect  

## 约束（旧包）

1. 覆盖本页表格列与表单/筛选项；勿只写 1～2 个示意字段就结束（除非页面确实极少字段）。
2. `code` 与交互说明、规则引用保持一致。
3. **旧包**可继续用本 YAML；**新页**以 Markdown 字段表为准，不必再维护 `fields.yaml`。
4. 对应控件必须用 `references/controls/` 骨架，禁止裸 `input[type=date]` 等系统控件冒充 OB。
5. **`description` 要贴页面**：写清含义、默认值、单位/枚举要点；列表关键列补充「数据来源」一句。禁止只写字段名的同义反复。
6. 表单必填 vs 筛选项勿混用同一 `required` 语义；筛选项一般无「必填」。

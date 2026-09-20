# 菜单栏目规划表（示范）

上游见 [req-breakdown.md](./req-breakdown.md)。场景二：L1=用户类型。

| 用户类型 | 一级菜单 | 二级菜单 | 三级菜单（可选） | 页面名称 | 页面类型 | page-id（拟定） | 终端 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 管理员 | 巡检管理 | — | — | 巡检计划列表 | 列表 | inspect-plan-list | PC | P0 |
| 管理员 | 巡检管理 | — | — | 巡检计划详情 | 详情 | inspect-plan-detail | PC | 列表 children |
| 执行人员 | 任务执行 | — | — | 巡检任务列表 | 列表 | inspect-task-list | PC | P0 |

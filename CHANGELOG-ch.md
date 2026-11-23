# 变更记录

**中文** · [English](CHANGELOG.md)

## 0.2.1（2026-11-23）

编辑器要求 `reactive-md@^0.9.2` 引擎 peer。该引擎补丁新增
`reactive-md/observability` 入口与 `LocalCompileScheduler` 的 observer 支持。

### 新增

- `ReactiveMarkdownCodeEditor` 接受可选的 `observer` prop，类型为
  `reactive-md/observability` 中的 `LocalObserver`。私有分析调度器通过
  `onDiagnostic` 与 `onTrace` 转发编译诊断和 Worker 链路事件。更换 observer
  会重建调度器。

### 修复

- 引擎的 fatal 诊断使用 CodeMirror 的 error 级别显示。

## 0.2.0（2026-11-20）

分析 Worker 打包了 `reactive-md@0.9.0`。编辑器支持 0.9.x 引擎系列。

### 变更

- 将所有仅移动端的功能移入 `src/mobile/`：工具栏界面、文案、断点、移动端文档栏
  标记与 `mobileBar` prop 现在集中在同一层。
- `src/components/` 中的共享工具栏渲染桌面控件集，并以可选的
  `CompactToolbarChrome` 从移动层取得窄屏界面；它不引入 `mobile/` 中的任何模块。
- 将 `mobileBar` prop 从共享 props 接口移入仅移动端的 props 接口。CodeMirror
  外壳仍接受该 prop。
- 将窄屏阈值收敛为一个主数值。760px 的编辑器容器驱动紧凑工具栏、分栏收起、
  行号槽与状态栏；`MobileDocBar` 等位于编辑器之外的界面在视口上使用同一数值。
  400px 仍作为极小屏密度档，触摸设备用 pointer 查询，与宽度无关。此前工具栏在
  640 切换、分栏与行号槽在 600 切换、移动文档栏在 620 切换，既留下空档，也使
  视口约 700px 时完整工具栏折成两行。
- 新增 `src/mobile/breakpoints.ts`，作为 760px 容器阈值、760px 视口查询与
  400px 密度档在 JavaScript 中的唯一来源。
- 移除工具栏中独立的 Link 按钮。Link 只保留在插入菜单中，工具栏不再重复。
- 基础组件样式表不再包含移动端钩子。`mobile/mobile.css` 与
  `mobile/toolbar-compact.css` 在 `styles/editor.css` 之后加载。
- 将移动端测试集中到 `tests/mobile/`，并新增移动层边界与共享阈值的架构守卫。
- 将原生组件选择器与 authoring 绑定、选区辅助模块从工具栏和编辑面板中拆出，
  分别为 `components/native-component-picker.tsx`、
  `authoring/source-selection.ts`、`contracts/authoring.ts` 与
  `localization/source-authoring-copy.ts`，编辑行为不变。

包入口路径未变。根入口与 `./codemirror` 入口新增导出 `EditorComponentMode` 类型
（`'default' | 'minimal'`）。

## 0.1.0（2026-11-12）

首个独立编辑器发行版，与 `reactive-md@0.8.0` 配合使用。

### 新增

- 将 CodeMirror 6 编辑器从 `reactive-md/editor` 拆分为独立的
  `reactive-md-editor` 包。
- 公共入口：`reactive-md-editor`、`reactive-md-editor/codemirror`、
  `reactive-md-editor/commands`、`reactive-md-editor/styles.css` 与
  `reactive-md-editor/codemirror/styles.css`。
- 发布包包含 `dist`、`README.md`、`README-ch.md`、`CHANGELOG.md`、
  `CHANGELOG-ch.md`、`LICENSE` 和 `THIRD_PARTY_NOTICES.md`。
- 分析功能作为独立的浏览器 Worker 发布。Worker 打包结果包含它导入的引擎代码；
  库入口将 React 和 `reactive-md` 子路径保持为外部依赖，并将 CodeMirror 打包进
  一个共享 chunk。

### 要求

- Node 22.12 或更高。
- React `^19.0.0`；`react-dom` `^19.0.0` 为可选 peer。
- 引擎 peer 范围 `^0.8.0`，覆盖稳定的 0.8 系列。开发安装使用内容哈希
  固定已发布的 0.8.0 tarball。

### 迁移

| 原导入 | 0.1.0 导入 |
| --- | --- |
| `reactive-md/editor` | `reactive-md-editor` |
| `reactive-md/editor/codemirror` | `reactive-md-editor/codemirror` |
| `reactive-md/editor/styles.css` | `reactive-md-editor/styles.css` |

`ReactiveMarkdownEditor` 与 `ReactiveMarkdownCodeEditor` 仍是公共组件名，指向同一
组件。`reactive-md-editor/commands` 会再导出 `reactive-md/authoring` 的纯命令。

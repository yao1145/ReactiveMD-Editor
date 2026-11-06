# 源码目录

[English](source-layout-en.md)

`src/` 按职责分组。分组只改变文件路径：包的入口、公开 API、依赖、版本与发布流程保持不变。

## 稳定入口

以下文件留在当前位置。`package.json` 的 `exports`、`vite.config.ts` 的构建入口和类型声明输出都指向它们。

| 路径 | 作用 |
| --- | --- |
| `src/index.ts` | 组件公开入口。不引入 CSS，组件可被 tree-shaking，也可在服务端渲染。 |
| `src/library.ts` | `reactive-md-editor` 的构建入口。引入 `styles/editor.css` 与 `codemirror/codemirror.css`，再导出 `index.ts`。 |
| `src/commands.ts` | `reactive-md-editor/commands` 的构建入口。重新导出引擎中不依赖 DOM 的编辑命令。 |
| `src/codemirror/index.ts` | `reactive-md-editor/codemirror` 的公开入口。 |
| `src/codemirror/library.ts` | `reactive-md-editor/codemirror` 的构建入口。引入两份样式表，再导出 `codemirror/index.ts`。 |
| `src/css.d.ts` | CSS 引入的环境声明。 |

## 各目录职责

| 目录 | 职责 |
| --- | --- |
| `src/contracts/` | 共享契约。`types.ts` 存放 props、语言、主题、视图模式与编辑类型。`surface.ts` 定义 `EditorSurface`，即工具栏和编辑面板读取编辑器、订阅更新和监听按键的接口。`command-types.ts` 重新导出引擎的 authoring 类型，让命令相关模块共用一处类型来源。 |
| `src/authoring/` | 源码编辑辅助。`source-authoring.tsx` 是提供补全、格式化和绑定重命名的面板，所有操作返回 `EditorEdit`。`source-positions.ts` 是 LF 位置索引。`editor-commands.ts`、`native-components.ts` 和 `extended-native-components.ts` 保留编辑器内部的引擎命令与原生组件目录导入路径。`source-authoring.css` 提供面板样式。 |
| `src/components/` | 编辑器外围界面。`editor-toolbar.tsx` 渲染格式工具栏，并从选区推导当前格式状态。`editor-view-bar.tsx` 渲染字数与视图模式栏。每个组件自带同名 CSS 文件。 |
| `src/localization/` | `locale.tsx` 提供编辑器私有的语言上下文与 `useEditorLocale`。`editor-i18n.ts` 存放工具栏、视图栏和界面文案表。 |
| `src/styles/` | `editor.css` 是样式汇总入口。它在 `.reactive-md-editor` 下定义主题变量，并用 `@import` 引入组件与编辑面板样式。 |
| `src/codemirror/` | CodeMirror 集成。`ReactiveMarkdownCodeEditor.tsx` 是 React 外壳。`controller.ts` 持有 `EditorView`、历史记录、诊断与源码变更流程。`types.ts` 存放 props、handle 与 transaction 类型。`source-coordinates.ts` 在 CM6 的 LF 文本与原始源码之间映射。`highlighting.ts` 定义语法高亮样式。`analysis-worker.ts` 启动本地编译 Worker，作为独立的浏览器资源。`codemirror.css` 提供 CM6 区域样式。 |

测试位于 `tests/`，直接引入源码模块；新增测试也放在 `tests/` 下。

## 跨目录引入方向

跨目录引入使用具体的相对文件路径，各组不设 `index.ts` 汇总出口。

- `contracts/` 依赖引擎与 React 类型，不引入其他编辑器分组。
- `localization/` 引入 `contracts/`。
- `components/` 与 `authoring/` 引入 `contracts/` 和 `localization/`。
- `codemirror/` 组合全部分组，是唯一挂载它们的目录。
- `styles/editor.css` 引入 `components/editor-toolbar.css`、`authoring/source-authoring.css` 与 `components/editor-view-bar.css`。

引擎保持为公开依赖：编辑器代码从 `reactive-md` 和 `reactive-md/authoring` 引入。本地开发使用 `vendor/` 中固定版本的 tarball，编辑器不链接同级引擎源码目录。

## 新文件的位置

- 新的 props、handle 与共享接口：`contracts/`。
- 新的工具栏、状态栏或面板界面：`components/`，CSS 放在组件旁边。
- 新的编辑面板行为、位置计算或引擎再导出：`authoring/`。
- 新的界面文案：`localization/editor-i18n.ts`；只供单个组件使用的文案可放在该组件旁。
- 新的 CodeMirror 扩展、控制器行为或源码映射：`codemirror/`。
- 新的主题变量或样式表引入：`styles/editor.css`。

## CSS 与浏览器资源规则

组件样式与组件放在同一目录。汇总入口 `styles/editor.css` 引入这些文件并提供主题变量；`codemirror/codemirror.css` 负责 CM6 区域的样式。只有 `src/library.ts` 和 `src/codemirror/library.ts` 为构建引入样式表，所有选择器都限定在 `.reactive-md-editor` 或 `.rmd-cm6` 之下。

`codemirror/analysis-worker.ts` 由 `ReactiveMarkdownCodeEditor.tsx` 中的 `new URL('./analysis-worker.ts', import.meta.url)` 引用。移动 Worker 时要与编辑器外壳一起移动，或更新这个 URL，因为构建会把它输出为独立的浏览器资源。

## 目录规则

- 新文件放入已有分组，不新增公开入口或汇总出口。
- `index.ts` 不引入 CSS。
- 跨目录使用具体路径引入，不通过分组汇总出口。
- 公开 specifier 与构建入口保持不变。

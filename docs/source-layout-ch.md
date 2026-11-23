# 源码目录

[English](source-layout-en.md)

`src/` 按职责分组。分组只改变文件路径：包的入口、公开 API、依赖、版本与发布流程保持不变。

## 稳定入口

以下文件留在当前位置。`package.json` 的 `exports`、`vite.config.ts` 的构建入口和类型声明输出都指向它们。

| 路径 | 作用 |
| --- | --- |
| `src/index.ts` | 组件公开入口。不引入 CSS，组件可被 tree-shaking，也可在服务端渲染。 |
| `src/library.ts` | `reactive-md-editor` 的构建入口。先引入 `styles/editor.css`，再引入 `mobile/mobile.css` 与 `codemirror/codemirror.css`，最后导出 `index.ts`。 |
| `src/commands.ts` | `reactive-md-editor/commands` 的构建入口。重新导出引擎中不依赖 DOM 的编辑命令。 |
| `src/codemirror/index.ts` | `reactive-md-editor/codemirror` 的公开入口。 |
| `src/codemirror/library.ts` | `reactive-md-editor/codemirror` 的构建入口。按同样顺序引入样式表，再导出 `codemirror/index.ts`。 |
| `src/css.d.ts` | CSS 引入的环境声明。 |

## 各目录职责

| 目录 | 职责 |
| --- | --- |
| `src/contracts/` | 共享契约。`types.ts` 存放 props、语言、主题、视图模式与编辑类型。`surface.ts` 定义 `EditorSurface`，即工具栏和编辑面板读取编辑器、订阅更新和监听按键的接口。`command-types.ts` 重新导出引擎的 authoring 类型，让命令相关模块共用一处类型来源。`authoring.ts` 从引擎的 `reactive-md/authoring` 再导出 `AuthorToken`、`AuthorBinding`、`AuthorCompletion` 与 `AuthorAnalysis` 类型，作为编辑器内 authoring 数据的唯一类型来源。 |
| `src/authoring/` | 源码编辑辅助。`source-authoring.tsx` 是提供补全、格式化和绑定重命名的面板，所有操作返回 `EditorEdit`。`source-positions.ts` 是 LF 位置索引。`source-selection.ts` 查找偏移处的绑定，并在源码重写与编辑之间映射偏移，供补全与重命名使用。`editor-commands.ts`、`native-components.ts` 和 `extended-native-components.ts` 保留编辑器内部的引擎命令与原生组件目录导入路径。`source-authoring.css` 提供面板样式。 |
| `src/components/` | 编辑器外围界面，与宽度无关。`editor-toolbar.tsx` 渲染桌面控件集，并从选区推导当前格式状态；它保留全部状态、行为与数据，接受可选的 `CompactToolbarChrome` 提供窄屏标题标签、组件触发内容与溢出菜单，且不引入 `mobile/` 中的任何模块。`toolbar-parts.tsx` 存放两层共用的展示原语（`Icon`、`ToolbarButton`、`keepEditorFocus`、`moveMenuFocus`、`getMenuItems`）。`toolbar-compact.ts` 定义 `CompactToolbarChrome` 与溢出菜单的 props。`editor-view-bar.tsx` 渲染字数与视图模式栏。两者的样式分别放在同目录的 `editor-toolbar.css` 与 `editor-view-bar.css`。`native-component-picker.tsx` 渲染可搜索的原生组件目录选择器，供工具栏插入组件。 |
| `src/mobile/` | 窄屏适配。`mobile.css` 是移动层入口：引入 `toolbar-compact.css`，并保留其余按容器与视口触发的紧凑规则、行号槽与诊断标记、状态栏、编辑面板与分栏折叠规则、配对编辑器的页脚隐藏以及 `MobileDocBar` 样式。`toolbar-compact.css` 负责工具栏的全部紧凑尺寸、菜单定位与触摸规则。`compact-toolbar.tsx` 提供 `useCompactToolbarChrome()`；`compact-toolbar-copy.ts` 存放仅移动端使用的文案；`use-compact-view.ts` 在窄屏下收起分栏；`use-narrow-editor.ts` 跟踪编辑器容器宽度；`use-compact-menu-placement.ts` 把工具栏菜单限制在视口内；`breakpoints.ts` 是 760px 容器阈值、760px 视口查询与 400px 密度档在 JavaScript 中的唯一来源；`mobile-bar-attributes.ts` 标记与 `MobileDocBar` 配对的编辑器；`types.ts` 存放仅移动端的 `mobileBar` prop；`mobile-doc-bar.tsx` 是宿主可选的移动端文档栏。 |
| `src/localization/` | `locale.tsx` 提供编辑器私有的语言上下文与 `useEditorLocale`。`editor-i18n.ts` 存放工具栏、视图栏和界面文案表。`source-authoring-copy.ts` 存放 authoring 面板的中英文文案。 |
| `src/styles/` | `editor.css` 是样式汇总入口。它在 `.reactive-md-editor` 下定义主题变量，并用 `@import` 引入组件与编辑面板样式。 |
| `src/codemirror/` | CodeMirror 集成。`ReactiveMarkdownCodeEditor.tsx` 是 React 外壳，也是唯一组合两层的地方：它调用 `useCompactView` 与 `useCompactToolbarChrome`，并把 `compact` 传给工具栏。`controller.ts` 持有 `EditorView`、历史记录、诊断与源码变更流程。`types.ts` 存放 props、handle 与 transaction 类型，并用仅移动端的 `MobileEditorProps` 扩展公开 props。`source-coordinates.ts` 在 CM6 的 LF 文本与原始源码之间映射。`highlighting.ts` 定义语法高亮样式。`analysis-worker.ts` 启动本地编译 Worker，作为独立的浏览器资源。`codemirror.css` 提供 CM6 区域样式。 |

测试位于 `tests/`，直接引入源码模块；移动端测试位于 `tests/mobile/`。新增测试放入对应目录。

## 跨目录引入方向

跨目录引入使用具体的相对文件路径，各组不设 `index.ts` 汇总出口。

- `contracts/` 依赖引擎与 React 类型，不引入其他编辑器分组。
- `localization/` 引入 `contracts/`。
- `components/` 与 `authoring/` 引入 `contracts/` 和 `localization/`。`components/` 不得引入 `mobile/`；窄屏界面通过 `CompactToolbarChrome` 以数据形式传入工具栏。
- `mobile/` 引入 `contracts/`、`localization/`，以及 `components/toolbar-parts.tsx` 中的展示原语和 `components/toolbar-compact.ts` 中仅作类型使用的 `CompactToolbarChrome` 接口。
- `codemirror/` 组合全部分组（含 `mobile/`），是唯一挂载它们的目录。
- `styles/editor.css` 引入 `components/editor-toolbar.css`、`authoring/source-authoring.css` 与 `components/editor-view-bar.css`，不引入任何移动端样式表；`src/library.ts` 与 `src/codemirror/library.ts` 在汇总入口之后加载 `mobile/mobile.css`。

引擎保持为公开依赖：编辑器代码从 `reactive-md` 和 `reactive-md/authoring` 引入。本地开发使用 `vendor/` 中固定版本的 tarball，编辑器不链接同级引擎源码目录。

## 新文件的位置

- 新的 props、handle 与共享接口：`contracts/`。仅移动端的 props 放入 `mobile/types.ts`，让共享契约与宽度无关。
- 新的工具栏、状态栏或面板界面：`components/`，与宽度无关，CSS 放在组件旁边。
- 新的共享工具栏展示原语：`components/toolbar-parts.tsx`；新的窄屏界面、文案或断点：`mobile/`。
- 新的编辑面板行为、位置计算或引擎再导出：`authoring/`。
- 新的界面文案：`localization/editor-i18n.ts`；只供单个组件使用的文案可放在该组件旁，仅移动端使用的文案放入 `mobile/`。
- 新的 CodeMirror 扩展、控制器行为或源码映射：`codemirror/`。
- 新的主题变量或样式表引入：`styles/editor.css`；窄屏规则放入 `mobile/`。

## CSS 与浏览器资源规则

组件样式与组件放在同一目录。汇总入口 `styles/editor.css` 引入这些文件并提供主题变量；`codemirror/codemirror.css` 负责 CM6 区域的样式。基础组件样式表不包含移动端钩子：移动层（`mobile/mobile.css`，并引入 `mobile/toolbar-compact.css`）经由 `src/library.ts` 与 `src/codemirror/library.ts` 在 `styles/editor.css` 之后加载。视图栏按钮的触摸目标尺寸来自基础样式表中的 `--control-height-lg` 变量，`touch-action` 由移动端样式表提供。所有选择器都限定在 `.reactive-md-editor` 或 `.rmd-cm6` 之下。

`codemirror/analysis-worker.ts` 由 `ReactiveMarkdownCodeEditor.tsx` 中的 `new URL('./analysis-worker.ts', import.meta.url)` 引用。移动 Worker 时要与编辑器外壳一起移动，或更新这个 URL，因为构建会把它输出为独立的浏览器资源。

## 分析可观察性

`ReactiveMarkdownCodeEditor` 接受可选的 `observer` prop，类型为 `reactive-md/observability` 中的 `LocalObserver`。私有分析调度器通过 `onDiagnostic` 和 `onTrace` 转发诊断与 Worker 链路事件。更换 observer 会重建调度器及其 Worker；跨渲染保持引用稳定。引擎 peer 要求为 `^0.9.2`。引擎的 fatal 诊断使用 CodeMirror 的 error 样式显示。

## 目录规则

- 新文件放入已有分组，不新增公开入口或汇总出口。
- `index.ts` 不引入 CSS。
- 跨目录使用具体路径引入，不通过分组汇总出口。
- 公开 specifier 与构建入口保持不变。

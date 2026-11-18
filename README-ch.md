# reactive-md-editor

**中文** · [English](README.md)

用于 Reactive MD 文档的 CodeMirror 6 源码编辑器。它以语法高亮渲染 Markdown
源码，并提供格式化工具栏、写作辅助和可选的预览区域。

`reactive-md-editor@0.1.0` 支持 `reactive-md@0.8.x` 引擎。
请一起安装编辑器与引擎：

## 安装

```bash
npm install reactive-md-editor@0.1.0 reactive-md@0.8.0 react@^19.0.0 react-dom@^19.0.0
```

`reactive-md` 是 peer dependency，范围为 `^0.8.0`，覆盖稳定的 0.8 系列。
需要 React 19；`react-dom` 是可选 peer；Node 版本要求 22.12 或更高。

编辑器已内置 CodeMirror，因此不要单独安装 CodeMirror 包。

## 使用

```tsx
import { ReactiveMarkdownEditor } from 'reactive-md-editor';
import 'reactive-md-editor/styles.css';

export function Editor({ value, onChange }: { value: string; onChange(value: string): void }) {
  return (
    <ReactiveMarkdownEditor
      value={value}
      onChange={onChange}
      locale="en"
      height={560}
    />
  );
}
```

传入 `preview` 即可在源码旁渲染文档。工具栏和写作面板与预览使用相同的
`compileOptions`，因此分析、补全和插入行为保持一致。

工具栏的「导出」通过 `onExport` 打开宿主的格式选择，可以在其中提供 PDF。
默认与精简模式由宿主设置。切换时同步更新编辑器和预览的 `compileOptions`，
让组件目录、分析、渲染和导出使用同一份配置。

### 入口

| Specifier | Contents |
| --- | --- |
| `reactive-md-editor` | 编辑器组件及其类型 |
| `reactive-md-editor/codemirror` | 迁移用 specifier 下的同一组件 |
| `reactive-md-editor/commands` | 无 DOM 依赖的 Markdown 工具栏命令 |
| `reactive-md-editor/styles.css` | 组件与 CodeMirror 样式 |
| `reactive-md-editor/codemirror/styles.css` | 同一份样式表的别名 |

`reactive-md-editor/commands` 会再导出引擎的 `reactive-md/authoring` 命令，因此
宿主无需 React 组件树也能使用这些纯文本变换。

## 从 `reactive-md/editor` 迁移

编辑器现在位于独立包中。修改导入 specifier，安装 `reactive-md-editor`，并继续
把 `reactive-md` 作为引擎依赖。

| 原导入 | 0.1.0 导入 |
| --- | --- |
| `reactive-md/editor` | `reactive-md-editor` |
| `reactive-md/editor/codemirror` | `reactive-md-editor/codemirror` |
| `reactive-md/editor/styles.css` | `reactive-md-editor/styles.css` |

`ReactiveMarkdownEditor` 与 `ReactiveMarkdownCodeEditor` 仍是公共组件名，指向同一
组件。新包还提供 `reactive-md-editor/codemirror/styles.css`，作为同一份样式表的
别名。

## 分析 Worker

编辑器在独立的浏览器 Worker 中运行分析，产物为
`dist/assets/analysis-worker-*.js`。Worker 打包结果包含它导入的引擎代码。库入口
将 React 和所有 `reactive-md` 子路径保持为外部依赖，CodeMirror 则打包进一个共享
chunk。如果发出的 Worker 仍包含未解析的包导入，打包消费者检查会失败。

## 源码结构

`src/` 按职责分组：`contracts`、`authoring`、`components`、`localization`、
`styles` 和 `codemirror`。目录映射与导入规则见
[source-layout-ch.md](https://github.com/yao1145/ReactiveMD-Editor/blob/main/docs/source-layout-ch.md)，
或 [English](https://github.com/yao1145/ReactiveMD-Editor/blob/main/docs/source-layout-en.md)。

## 开发

开发安装从 `vendor/reactive-md-0.8.0-087db7b17a3b.tgz` 解析引擎。该文件从 npm
下载并经过 registry 完整性校验，文件名带有 SHA-256 内容前缀。安装前请将它放入
`vendor/`；它是开发依赖，不属于编辑器发布包的内容。

```bash
npm ci
npm run check
```

`check` 会运行类型检查、vitest 测试套件、Vite 构建和声明文件生成，然后打包并验证
打包后的消费者。发布包包含 `dist`、两份 README、两份变更记录、`LICENSE` 和
`THIRD_PARTY_NOTICES.md`。

## 发布

1. 核对 vendor tarball 与最终 `reactive-md@0.8.0` 发行包一致。若引擎内容变化，
   将 `devDependencies.reactive-md` 更新为新的内容哈希文件名，刷新 lockfile 并重新构建。
2. 运行 `npm run notices`。Worker 打包了引擎代码，因此
   `THIRD_PARTY_NOTICES.md` 必须对应稳定引擎。
3. 在干净安装的环境下运行 `npm run check`。发布工作流还会接着运行
   `npm run notices` 和 `git diff --exit-code -- THIRD_PARTY_NOTICES.md`，因为发布
   打包使用 `--ignore-scripts`。
4. 先将 `reactive-md@0.8.0` 发布到 npm。
5. 再使用 **Publish npm package** 工作流发布 `reactive-md-editor@0.1.0`。正式版本
   选择 `dist_tag=latest`。工作流在发布新的编辑器版本前确认
   `reactive-md@0.8.0` 已存在于 registry。

候选版本试发时保持 `update_latest=false`，避免 `next` 发布移动 `latest`。正式的
`dist_tag=latest` 发布直接设置该 tag，不使用额外的 `update_latest` 步骤。

发布使用 npm trusted publishing (OIDC)。`reactive-md-editor` 包需要为本仓库和
`publish.yml` 在 npm 上配置自己的 trusted publisher；引擎的发布者配置不适用。
不使用 `NPM_TOKEN` 密钥。当版本已存在时，工作流会跳过发布，只应用请求的
dist-tags。

候选 tarball 文件名带有 SHA256 前缀。请使用 `package.json` 中确切的 vendor
文件名；只要包内容发生变化，就更新这些路径和 lockfile 完整性。

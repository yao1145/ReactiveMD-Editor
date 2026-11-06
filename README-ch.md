# reactive-md-editor

**中文** · [English](README.md)

用于 Reactive MD 文档的 CodeMirror 6 源码编辑器。它以语法高亮渲染 Markdown
源码，并提供格式化工具栏、写作辅助和可选的预览区域。

## 安装

```bash
npm install reactive-md-editor reactive-md react react-dom
```

编辑器已内置 CodeMirror，因此不要单独安装 CodeMirror 包。`reactive-md` 是固定为
`0.8.0-next.0` 的 peer dependency；请安装与编辑器版本匹配的引擎发行版。

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

### 入口

| Specifier | Contents |
| --- | --- |
| `reactive-md-editor` | 编辑器组件及其类型 |
| `reactive-md-editor/codemirror` | 迁移用 specifier 下的同一组件 |
| `reactive-md-editor/commands` | 无 DOM 依赖的 Markdown 工具栏命令 |
| `reactive-md-editor/styles.css` | 组件与 CodeMirror 样式 |
| `reactive-md-editor/codemirror/styles.css` | 同一份样式表的别名 |

`reactive-md-editor/commands` 会再导出引擎的 `reactive-md/authoring` 命令，
因此已经依赖该引擎的宿主可以直接从那里导入这些命令。

## 开发

该包从 `vendor/reactive-md-0.8.0-next.0.tgz` 解析引擎。安装前请先将该 tarball
放入 `vendor/`；它是开发依赖，不属于发布的包内容。

```bash
npm ci
npm run check
```

`check` 会运行类型检查、vitest 测试套件、Vite 构建和声明文件生成。构建产物中的
各个入口共享同一个 CodeMirror chunk。在库打包中，引擎子路径和 React 保持为外部
依赖，CodeMirror 则被打包进来。分析 worker 是独立的浏览器资源，因此其打包结果
包含它所导入的引擎代码。

## 发布

1. 更新 `package.json` 中的 `version`；如果公共接口发生变化，在本 README 中补充
   发布说明。
2. 在干净安装的环境下运行 `npm run check`。
3. 在 GitHub 上以目标 ref 和 dist-tag 运行 **Publish npm package** 工作流。

发布使用 npm trusted publishing (OIDC)。`reactive-md-editor` 包需要为本仓库和
`publish.yml` 在 npm 上配置自己的 trusted publisher；引擎的发布者配置不适用。
不使用 `NPM_TOKEN` 密钥。当版本已存在时，工作流会跳过发布，只应用请求的
dist-tags。

候选 tarball 文件名带有 SHA256 前缀。请使用 package.json 中确切的 vendor 文件名；只要包内容发生变化，就更新这些路径和 lockfile 完整性。

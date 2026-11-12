# 变更记录

**中文** · [English](CHANGELOG.md)

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

### 发布

1. 核对 vendor tarball 与最终 `reactive-md@0.8.0` 发行包一致。若内容变化，更新
   确切的依赖文件名与 lockfile，并重新构建，使 Worker 使用最终引擎。
2. 运行 `npm run notices`，然后运行
   `git diff --exit-code -- THIRD_PARTY_NOTICES.md`。
3. 在干净安装的环境下运行 `npm run check`：类型检查、vitest、构建、声明文件
   生成，以及针对 SSR、入口一致性、Worker 资源和 NodeNext 声明的打包消费者
   检查。
4. 发布 `reactive-md@0.8.0`。
5. 使用 `dist_tag=latest` 发布 `reactive-md-editor@0.1.0`。发布工作流会确认
   `reactive-md@0.8.0` 已存在于 registry，刷新 notices，并在版本已存在时跳过
   发布步骤。

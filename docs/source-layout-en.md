# Source layout

[中文](source-layout-ch.md)

`src/` groups files by responsibility. The grouping changes paths only: package
entry points, public APIs, dependencies, versions and the publish pipeline stay
as they are.

## Stable entry anchors

Keep these files at their current paths. `package.json` `exports`,
`vite.config.ts` build entries and declaration emit all resolve them.

| Path | Role |
| --- | --- |
| `src/index.ts` | Public component entry. Carries no CSS import, so the component stays tree-shakeable and server-renderable. |
| `src/library.ts` | Build entry for `reactive-md-editor`. Imports `styles/editor.css` and `codemirror/codemirror.css`, then re-exports `index.ts`. |
| `src/commands.ts` | Build entry for `reactive-md-editor/commands`. Re-exports the engine's DOM-free authoring commands. |
| `src/codemirror/index.ts` | Public entry for `reactive-md-editor/codemirror`. |
| `src/codemirror/library.ts` | Build entry for `reactive-md-editor/codemirror`. Imports both stylesheets and re-exports `codemirror/index.ts`. |
| `src/css.d.ts` | Ambient declaration for CSS imports. |

## Directories

| Directory | Responsibility |
| --- | --- |
| `src/contracts/` | Shared contracts. `types.ts` holds props, locale, theme, view mode and edit types. `surface.ts` defines `EditorSurface`, the read/subscribe/key event interface the toolbar and authoring panel use to talk to the editor. `command-types.ts` re-exports authoring types from the engine and keeps one type source for command-related modules. |
| `src/authoring/` | Authoring aids over the source pane. `source-authoring.tsx` is the panel that offers completion, formatting and binding rename, returning `EditorEdit` values. `source-positions.ts` is the LF position index. `editor-commands.ts`, `native-components.ts` and `extended-native-components.ts` preserve the editor's internal import paths for engine commands and the native component catalog. `source-authoring.css` styles the panel. |
| `src/components/` | Editor chrome. `editor-toolbar.tsx` renders the formatting toolbar and derives format state from the selection. `editor-view-bar.tsx` renders the per-document status and view-mode bar. Each component owns a sibling CSS file. |
| `src/localization/` | `locale.tsx` provides the editor-private locale context and `useEditorLocale`. `editor-i18n.ts` holds the toolbar, view and chrome copy tables. |
| `src/styles/` | `editor.css` is the stylesheet aggregator. It defines the theme tokens under `.reactive-md-editor` and `@import`s the component and authoring stylesheets. |
| `src/codemirror/` | CodeMirror integration. `ReactiveMarkdownCodeEditor.tsx` is the React shell. `controller.ts` owns the `EditorView`, history, diagnostics and source change pipeline. `types.ts` holds props, handle and transaction types. `source-coordinates.ts` maps CM6 LF text to the raw source. `highlighting.ts` defines the syntax highlight style. `analysis-worker.ts` boots the local compile worker as a standalone browser asset. `codemirror.css` styles the CM6 surface. |

Tests live in `tests/` and import source modules directly. New tests go there as
well.

## Import direction across groups

Cross-group imports use direct relative file paths. There are no group
`index.ts` barrels.

- `contracts/` depends on the engine and React types. It imports no other editor group.
- `localization/` imports `contracts/`.
- `components/` and `authoring/` import `contracts/` and `localization/`.
- `codemirror/` composes all groups and is the only group that mounts them.
- `styles/editor.css` imports `components/editor-toolbar.css`, `authoring/source-authoring.css` and `components/editor-view-bar.css`.

The engine stays a public dependency: editor code imports `reactive-md` and
`reactive-md/authoring`. Local development resolves the fixed vendor tarball in
`vendor/`; the editor does not link a sibling engine source tree.

## Where new files belong

- New props, handles, shared interfaces: `contracts/`.
- New toolbar, status or panel chrome: `components/`, with its CSS beside it.
- New authoring panel behaviour, position logic or engine re-exports: `authoring/`.
- New UI copy: `localization/editor-i18n.ts`; a string used by one component can live with that component.
- New CodeMirror extensions, controller behaviour or source mapping: `codemirror/`.
- New theme tokens or stylesheet imports: `styles/editor.css`.

## CSS and browser asset rules

Component CSS sits beside its component. The aggregator `styles/editor.css`
imports those files and supplies the theme tokens; `codemirror/codemirror.css`
styles the CM6 DOM. `src/library.ts` and `src/codemirror/library.ts` are the only
modules that import stylesheets for the build, and all selectors stay scoped to
`.reactive-md-editor` or `.rmd-cm6`.

`codemirror/analysis-worker.ts` is referenced by
`new URL('./analysis-worker.ts', import.meta.url)` in
`ReactiveMarkdownCodeEditor.tsx`. Move the worker together with the editor shell
or update that URL, because the build emits it as a separate browser asset.

## Layout rules

- Add files inside an existing group. Add no new public entry or barrel.
- Keep `index.ts` free of CSS imports.
- Use direct imports between groups instead of a group barrel.
- Keep the public specifiers and build entries unchanged.

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
| `src/library.ts` | Build entry for `reactive-md-editor`. Imports `styles/editor.css`, then `mobile/mobile.css` and `codemirror/codemirror.css`, then re-exports `index.ts`. |
| `src/commands.ts` | Build entry for `reactive-md-editor/commands`. Re-exports the engine's DOM-free authoring commands. |
| `src/codemirror/index.ts` | Public entry for `reactive-md-editor/codemirror`. |
| `src/codemirror/library.ts` | Build entry for `reactive-md-editor/codemirror`. Imports the stylesheets in the same order and re-exports `codemirror/index.ts`. |
| `src/css.d.ts` | Ambient declaration for CSS imports. |

## Directories

| Directory | Responsibility |
| --- | --- |
| `src/contracts/` | Shared contracts. `types.ts` holds props, locale, theme, view mode and edit types. `surface.ts` defines `EditorSurface`, the read/subscribe/key event interface the toolbar and authoring panel use to talk to the editor. `command-types.ts` re-exports authoring types from the engine and keeps one type source for command-related modules. |
| `src/authoring/` | Authoring aids over the source pane. `source-authoring.tsx` is the panel that offers completion, formatting and binding rename, returning `EditorEdit` values. `source-positions.ts` is the LF position index. `editor-commands.ts`, `native-components.ts` and `extended-native-components.ts` preserve the editor's internal import paths for engine commands and the native component catalog. `source-authoring.css` styles the panel. |
| `src/components/` | Editor chrome, width-agnostic. `editor-toolbar.tsx` renders the desktop control set and derives format state from the selection. It keeps all state, behaviour and data and accepts an optional `CompactToolbarChrome` for the narrow-frame heading label, component trigger content and overflow menu; it imports nothing from `mobile/`. `toolbar-parts.tsx` holds the presentation primitives both layers share (`Icon`, `ToolbarButton`, `keepEditorFocus`, `moveMenuFocus`, `getMenuItems`). `toolbar-compact.ts` defines `CompactToolbarChrome` and the overflow props. `editor-view-bar.tsx` renders the per-document status and view-mode bar. Their CSS lives beside them in `editor-toolbar.css` and `editor-view-bar.css`. |
| `src/mobile/` | Narrow-screen adaptation. `mobile.css` is the mobile entry: it imports `toolbar-compact.css` and holds the remaining container, viewport, gutter, status-bar, authoring and split-collapse rules, the paired-editor footer suppression and the `MobileDocBar` styles. `toolbar-compact.css` owns every compact toolbar metric, menu placement and touch rule. `compact-toolbar.tsx` supplies `useCompactToolbarChrome()`; `compact-toolbar-copy.ts` holds mobile-only strings; `use-compact-view.ts` collapses split on narrow frames; `use-narrow-editor.ts` follows the editor frame width; `use-compact-menu-placement.ts` keeps toolbar menus inside the viewport; `breakpoints.ts` is the single JS source for the 760px frame threshold, the 760px viewport query and the 400px density tier; `mobile-bar-attributes.ts` marks the editor paired with a `MobileDocBar`; `types.ts` holds the mobile-only `mobileBar` prop; `mobile-doc-bar.tsx` is the optional host-facing mobile bar. |
| `src/localization/` | `locale.tsx` provides the editor-private locale context and `useEditorLocale`. `editor-i18n.ts` holds the toolbar, view and chrome copy tables. |
| `src/styles/` | `editor.css` is the stylesheet aggregator. It defines the theme tokens under `.reactive-md-editor` and `@import`s the component and authoring stylesheets. |
| `src/codemirror/` | CodeMirror integration. `ReactiveMarkdownCodeEditor.tsx` is the React shell and the only composer of the two layers: it calls `useCompactView` and `useCompactToolbarChrome` and passes `compact` to the toolbar. `controller.ts` owns the `EditorView`, history, diagnostics and source change pipeline. `types.ts` holds props, handle and transaction types and extends the public props with the mobile-only `MobileEditorProps`. `source-coordinates.ts` maps CM6 LF text to the raw source. `highlighting.ts` defines the syntax highlight style. `analysis-worker.ts` boots the local compile worker as a standalone browser asset. `codemirror.css` styles the CM6 surface. |

Tests live in `tests/` and import source modules directly. Mobile tests live
under `tests/mobile/`. New tests go into the matching directory.

## Import direction across groups

Cross-group imports use direct relative file paths. There are no group
`index.ts` barrels.

- `contracts/` depends on the engine and React types. It imports no other editor group.
- `localization/` imports `contracts/`.
- `components/` and `authoring/` import `contracts/` and `localization/`. `components/` must not import `mobile/`; narrow-screen chrome reaches the toolbar as data through `CompactToolbarChrome`.
- `mobile/` imports `contracts/`, `localization/`, and the presentation primitives from `components/toolbar-parts.tsx`, plus the type-only `CompactToolbarChrome` interface from `components/toolbar-compact.ts`.
- `codemirror/` composes all groups, including `mobile/`, and is the only group that mounts them.
- `styles/editor.css` imports `components/editor-toolbar.css`, `authoring/source-authoring.css` and `components/editor-view-bar.css`. It imports no mobile stylesheet; `src/library.ts` and `src/codemirror/library.ts` load `mobile/mobile.css` after the aggregator.

The engine stays a public dependency: editor code imports `reactive-md` and
`reactive-md/authoring`. Local development resolves the fixed vendor tarball in
`vendor/`; the editor does not link a sibling engine source tree.

## Where new files belong

- New props, handles, shared interfaces: `contracts/`. Mobile-only props go in `mobile/types.ts` so the shared contract stays width-agnostic.
- New toolbar, status or panel chrome: `components/`, width-agnostic and with its CSS beside it.
- New shared toolbar presentation primitives: `components/toolbar-parts.tsx`; new narrow-screen chrome, copy or breakpoints: `mobile/`.
- New authoring panel behaviour, position logic or engine re-exports: `authoring/`.
- New UI copy: `localization/editor-i18n.ts`; a string used by one component can live with that component, and mobile-only strings go in `mobile/`.
- New CodeMirror extensions, controller behaviour or source mapping: `codemirror/`.
- New theme tokens or stylesheet imports: `styles/editor.css`; narrow-screen rules go in `mobile/`.

## CSS and browser asset rules

Component CSS sits beside its component. The aggregator `styles/editor.css`
imports those files and supplies the theme tokens; `codemirror/codemirror.css`
styles the CM6 DOM. Base component stylesheets carry no mobile hooks: the
mobile layer (`mobile/mobile.css`, which imports `mobile/toolbar-compact.css`)
loads after `styles/editor.css` through `src/library.ts` and
`src/codemirror/library.ts`. Touch-target sizing for the view bar's buttons
comes from the `--control-height-lg` token in the base sheet; `touch-action` is
supplied by the mobile sheet. All selectors stay scoped to
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

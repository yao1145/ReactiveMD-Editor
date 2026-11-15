# src

Directory map for the editor source. Full rules: [Source layout](../docs/source-layout-en.md) · [中文](../docs/source-layout-ch.md).

## Entry anchors

| Path | Role |
| --- | --- |
| `index.ts` | Public component entry, no CSS import |
| `library.ts` | `reactive-md-editor` build entry with styles |
| `commands.ts` | `reactive-md-editor/commands` build entry |
| `codemirror/index.ts` | `reactive-md-editor/codemirror` public entry |
| `codemirror/library.ts` | `reactive-md-editor/codemirror` build entry with styles |
| `css.d.ts` | CSS import declaration |

Keep these paths; package exports and Vite entries resolve them.

## Groups

| Directory | Contents |
| --- | --- |
| `contracts/` | Props, edit, locale and view-mode types; the `EditorSurface` interface; engine command type re-exports |
| `authoring/` | Authoring panel, source position index, engine command and component catalog re-exports, panel CSS |
| `components/` | Width-agnostic chrome: desktop toolbar with the optional `CompactToolbarChrome` interface, the view bar, and the shared `toolbar-parts.tsx` primitives, with `editor-toolbar.css` and `editor-view-bar.css` beside them |
| `localization/` | Locale context and UI copy tables |
| `styles/` | `editor.css` theme tokens and stylesheet imports |
| `mobile/` | Narrow-screen adaptation: viewport and container rules, compact toolbar chrome and copy, the absent-split hook, breakpoints, compact menu placement and the optional `MobileDocBar` |
| `codemirror/` | React shell that composes both layers, controller, CM6 types, source coordinates, highlighting, analysis worker, CM6 CSS |

Imports between groups use direct relative paths; no group barrel. `components/` never imports `mobile/`: the mobile layer supplies narrow-screen chrome as `CompactToolbarChrome` data, and `codemirror/` passes it down. Component CSS sits beside its component and is pulled into `styles/editor.css`; the mobile stylesheets (`mobile/mobile.css`, which imports `mobile/toolbar-compact.css`) load from the two build entries after that aggregator. The analysis worker must stay beside the editor shell or its `new URL` reference must move with it. Engine code comes from the public `reactive-md` and `reactive-md/authoring` specifiers.

Tests live in the repository `tests/` directory and import source modules directly; mobile tests are grouped under `tests/mobile/`.

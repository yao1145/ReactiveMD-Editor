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
| `components/` | Toolbar and view bar, each with a sibling CSS file |
| `localization/` | Locale context and UI copy tables |
| `styles/` | `editor.css` theme tokens and stylesheet imports |
| `codemirror/` | React shell, controller, CM6 types, source coordinates, highlighting, analysis worker, CM6 CSS |

Imports between groups use direct relative paths; no group barrel. Component CSS sits beside its component and is pulled into `styles/editor.css`. The analysis worker must stay beside the editor shell or its `new URL` reference must move with it. Engine code comes from the public `reactive-md` and `reactive-md/authoring` specifiers.

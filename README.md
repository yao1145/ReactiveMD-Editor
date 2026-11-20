# reactive-md-editor

**English** · [中文](README-ch.md)

CodeMirror 6 source editor for Reactive MD documents. It renders the Markdown
source with syntax highlighting, a formatting toolbar, authoring aids and an
optional preview slot.

`reactive-md-editor@0.2.0` supports the `reactive-md@0.9.x` engine series. The
published `0.1.0` release remains paired with `reactive-md@0.8.x`.

## Install

Install the editor and its engine together.

```bash
npm install reactive-md-editor@0.2.0 reactive-md@0.9.0 react@^19.0.0 react-dom@^19.0.0
```

`reactive-md` is a peer dependency with the range `^0.9.0`, covering stable
0.9 releases. React 19 is required, `react-dom` is an optional peer, and the
package requires Node 22.12 or newer.

The editor bundles CodeMirror, so do not add CodeMirror packages separately.

## Use

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

Pass `preview` to render a document beside the source. The toolbar and
authoring panel follow the same `compileOptions` as the preview, so analysis,
completion and insertion stay consistent.

Use the toolbar's Export action (`onExport`) to open the host's format picker,
including PDF. To offer Default and Minimal component modes in host settings,
pass the selected mode's `compileOptions` to the editor and preview so the
catalog, analysis, rendering, and export use the same registry.

### Entry points

| Specifier | Contents |
| --- | --- |
| `reactive-md-editor` | Editor component and its types |
| `reactive-md-editor/codemirror` | Same component under the migration specifier |
| `reactive-md-editor/commands` | DOM-free Markdown toolbar commands |
| `reactive-md-editor/styles.css` | Component and CodeMirror styles |
| `reactive-md-editor/codemirror/styles.css` | Alias of the same stylesheet |

`reactive-md-editor/commands` re-exports the engine's `reactive-md/authoring`
commands, so hosts can import the pure text transformations without the React
component tree.

## Migrating from `reactive-md/editor`

The editor now lives in its own package. Move the import, install
`reactive-md-editor`, and keep `reactive-md` as the engine dependency.

| Previous import | 0.1.0 import |
| --- | --- |
| `reactive-md/editor` | `reactive-md-editor` |
| `reactive-md/editor/codemirror` | `reactive-md-editor/codemirror` |
| `reactive-md/editor/styles.css` | `reactive-md-editor/styles.css` |

`ReactiveMarkdownEditor` and `ReactiveMarkdownCodeEditor` remain the public
component names and resolve to the same component. The new package also exposes
`reactive-md-editor/codemirror/styles.css` as an alias of its stylesheet.

## Analysis Worker

The editor runs analysis in a standalone browser Worker, emitted as
`dist/assets/analysis-worker-*.js`. The Worker bundle includes the engine code
it imports. The library entries keep React and every `reactive-md` subpath
external, and CodeMirror is bundled into one shared chunk. The packed-consumer
check fails if the emitted Worker still contains unresolved package imports.

## Source layout

`src/` groups code by responsibility: `contracts`, `authoring`, `components`,
`mobile`, `localization`, `styles` and `codemirror`. See
[source-layout-en.md](https://github.com/yao1145/ReactiveMD-Editor/blob/main/docs/source-layout-en.md)
for the directory map and import rules, or
[中文](https://github.com/yao1145/ReactiveMD-Editor/blob/main/docs/source-layout-ch.md).

## Development

The development install resolves the engine from the content-addressed
`reactive-md@0.9.0` tarball in `vendor/`. The dependency path includes the
SHA-256 prefix, and `package-lock.json` records the full npm integrity value.
The tarball is a development dependency used to build the Worker.

```bash
npm ci
npm run check
```

`check` runs the type checker, the vitest suite, the Vite build and declaration
emit, then packs the package and verifies the packed consumer for SSR, entry
identity, the Worker asset and NodeNext declarations. The package ships `dist`,
the two READMEs, the two changelogs, `LICENSE` and `THIRD_PARTY_NOTICES.md`.

## Release

1. Confirm that the vendor tarball matches the intended `reactive-md` release.
   The release uses `reactive-md@0.9.0`. Update `devDependencies.reactive-md` to
   its content-addressed filename and refresh the lockfile when preparing it.
2. Run `npm run notices`. The Worker bundles engine code, so
   `THIRD_PARTY_NOTICES.md` must reflect the stable engine.
3. Run `npm run check` from a clean install. The workflow also runs
   `npm run notices` followed by
   `git diff --exit-code -- THIRD_PARTY_NOTICES.md`, because the release pack
   uses `--ignore-scripts`.
4. Publish the engine from its own repository. To publish the exact tarball
   verified against a committed engine ref, use `use_verified_release` in the
   engine workflow. Compare npm integrity with the pinned tarball. If the hashes
   differ, vendor the published artifact, refresh the lockfile and rerun the
   editor checks.
5. Publish `reactive-md-editor@0.2.0` with the **Publish npm package** workflow and
   `dist_tag=latest` for the stable release. The workflow confirms the pinned
   engine version and verifies that its lockfile integrity matches npm's
   published engine artifact before publishing a new editor version.

Keep `update_latest=false` for candidate trials, so a `next` publish does not
move `latest`. A stable `dist_tag=latest` publish sets the tag directly and does
not use the extra `update_latest` step.

Publishing uses npm trusted publishing (OIDC). The `reactive-md-editor`
package needs its own trusted publisher on npm for this repository and
`publish.yml`; the engine's publisher configuration does not apply. No
`NPM_TOKEN` secret is used. The workflow skips publishing when the version
already exists and only applies the requested dist-tags.

Candidate tarball filenames include a SHA256 prefix. Use the exact vendor
filenames in `package.json`; update those paths and lockfile integrity whenever
package contents change.

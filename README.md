# reactive-md-editor

**English** · [中文](README-ch.md)

CodeMirror 6 source editor for Reactive MD documents. It renders the Markdown
source with syntax highlighting, a formatting toolbar, authoring aids and an
optional preview slot.

## Install

```bash
npm install reactive-md-editor reactive-md react react-dom
```

The editor bundles CodeMirror, so do not add CodeMirror packages separately.
`reactive-md` is a peer dependency pinned to `0.8.0-next.0`; install the engine
release that matches the editor version.

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

### Entry points

| Specifier | Contents |
| --- | --- |
| `reactive-md-editor` | Editor component and its types |
| `reactive-md-editor/codemirror` | Same component under the migration specifier |
| `reactive-md-editor/commands` | DOM-free Markdown toolbar commands |
| `reactive-md-editor/styles.css` | Component and CodeMirror styles |
| `reactive-md-editor/codemirror/styles.css` | Alias of the same stylesheet |

`reactive-md-editor/commands` re-exports the engine's `reactive-md/authoring`
commands, so hosts that already depend on the engine can import them there.

## Source layout

`src/` groups code by responsibility: `contracts`, `authoring`, `components`,
`localization`, `styles` and `codemirror`. See
[docs/source-layout-en.md](docs/source-layout-en.md) for the directory map and
import rules, or [中文](docs/source-layout-ch.md).

## Development

The package resolves the engine from `vendor/reactive-md-0.8.0-next.0.tgz`.
Place that tarball in `vendor/` before installing; it is a development
dependency and is not part of the published package.

```bash
npm ci
npm run check
```

`check` runs the type checker, the vitest suite, the Vite build and declaration
emit. The build produces entries that share one CodeMirror chunk. Engine
subpaths and React stay external in the library bundles; CodeMirror is bundled.
The analysis worker is a standalone browser asset, so its bundle includes the
engine code it imports.

## Release

1. Update `version` in `package.json` and add release notes to this README if
   the public surface changed.
2. Run `npm run check` from a clean install.
3. Run the **Publish npm package** workflow on GitHub with the target ref and
   dist-tag.

Publishing uses npm trusted publishing (OIDC). The `reactive-md-editor`
package needs its own trusted publisher on npm for this repository and
`publish.yml`; the engine's publisher configuration does not apply. No
`NPM_TOKEN` secret is used. The workflow skips publishing when the version
already exists and only applies the requested dist-tags.

Candidate tarball filenames include a SHA256 prefix. Use the exact vendor filenames in package.json; update those paths and lockfile integrity whenever package contents change.

# Changelog

**English** · [中文](CHANGELOG-ch.md)

## 0.1.0 (2026-11-12)

Initial independent editor release, paired with `reactive-md@0.8.0`.

### Added

- Split the CodeMirror 6 editor out of `reactive-md/editor` into the independent
  `reactive-md-editor` package.
- Public entries: `reactive-md-editor`, `reactive-md-editor/codemirror`,
  `reactive-md-editor/commands`, `reactive-md-editor/styles.css` and
  `reactive-md-editor/codemirror/styles.css`.
- Package `dist`, `README.md`, `README-ch.md`, `CHANGELOG.md`,
  `CHANGELOG-ch.md`, `LICENSE` and `THIRD_PARTY_NOTICES.md`.
- Ship analysis as a standalone browser Worker. Its bundle includes the engine
  code it imports; the library entries keep React and `reactive-md` subpaths
  external and bundle CodeMirror into one shared chunk.

### Requirements

- Node 22.12 or newer.
- React `^19.0.0`; `react-dom` `^19.0.0` as an optional peer.
- Engine peer range `^0.8.0`, covering stable 0.8 releases. Development pins
  the published 0.8.0 tarball by its content hash.

### Migration

| Previous import | 0.1.0 import |
| --- | --- |
| `reactive-md/editor` | `reactive-md-editor` |
| `reactive-md/editor/codemirror` | `reactive-md-editor/codemirror` |
| `reactive-md/editor/styles.css` | `reactive-md-editor/styles.css` |

`ReactiveMarkdownEditor` and `ReactiveMarkdownCodeEditor` remain the public
component names and resolve to the same component. `reactive-md-editor/commands`
re-exports the pure commands from `reactive-md/authoring`.

### Release

1. Match the vendor tarball to the final `reactive-md@0.8.0` release. If its
   contents change, update the exact dependency filename and lockfile, then
   rebuild so the Worker uses the final engine.
2. Run `npm run notices`, then
   `git diff --exit-code -- THIRD_PARTY_NOTICES.md`.
3. Run `npm run check` from a clean install: typecheck, vitest, build,
   declaration emit, and the packed-consumer check for SSR, entry identity,
   Worker asset and NodeNext declarations.
4. Publish `reactive-md@0.8.0`.
5. Publish `reactive-md-editor@0.1.0` with `dist_tag=latest`. The publish
   workflow verifies that `reactive-md@0.8.0` is on the registry, refreshes
   notices, and skips the publish step when the version already exists.

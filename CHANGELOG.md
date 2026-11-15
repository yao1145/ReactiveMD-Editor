# Changelog

**English** · [中文](CHANGELOG-ch.md)

## Unreleased

### Changed

- Moved every mobile-only feature into `src/mobile/`: toolbar chrome, copy,
  breakpoints, the mobile bar marker and the `mobileBar` prop now sit in one
  layer.
- The shared toolbar in `src/components/` renders the desktop control set and
  takes narrow-screen chrome from the mobile layer as an optional
  `CompactToolbarChrome`; it imports nothing from `mobile/`.
- Moved the `mobileBar` prop out of the shared props interface into the
  mobile-only props interface. The CodeMirror shell still accepts it.
- Collapsed the narrow-screen thresholds into one primary value. A 760px
  editor frame drives the compact toolbar, split collapse, gutter and status
  bar; host-facing chrome such as `MobileDocBar` uses the same number on the
  viewport. 400px remains a density tier and pointer queries cover touch at any
  width. Previously the toolbar switched at 640, split and gutter at 600 and
  the mobile bar at 620, which left a dead zone and made the full toolbar wrap
  onto two rows around a 700px viewport.
- Added `src/mobile/breakpoints.ts` as the single JavaScript source for the
  760px frame threshold, the 760px viewport query and the 400px density tier.
- Removed the standalone Link toolbar button. Link is available in the Insert
  menu only, so the toolbar no longer repeats it.
- Base component stylesheets carry no mobile hooks. `mobile/mobile.css` and
  `mobile/toolbar-compact.css` load after `styles/editor.css`.
- Grouped mobile tests under `tests/mobile/` and added architecture guards for
  the mobile boundary and the shared thresholds.

Public API and package entries are unchanged.

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

# Editor package conventions

This repository is the standalone `reactive-md-editor` package. It owns the
CodeMirror editor, its React components, styles and DOM-free command re-exports.

## Layout

- `src/` — package source. All engine imports use public specifiers:
  `reactive-md` or `reactive-md/authoring`. Relative imports that leave `src/`
  are not allowed.
- `tests/` — vitest coverage for commands, source coordinates, source positions
  and the CodeMirror controller.
- `vendor/` — local engine tarball used by the development install. Only
  `vendor/*.tgz` is tracked.
- `dist/` — build output. Never edit by hand.

## Commands

```bash
npm ci
npm run check        # typecheck + tests + build + declarations + packed consumer
npm run build:js     # Vite library only
npm run build:types  # declaration emit only
npm test
npm run typecheck
```

## Boundaries

- Pure toolbar commands, native-component catalog data and command copy belong
  to the engine (`reactive-md/authoring`). The editor keeps only UI copy.
- React and all `reactive-md` subpaths stay external in the bundle. CodeMirror
  is bundled and shared by both entries.
- The published package contains `dist`, `README.md`, `LICENSE` and `THIRD_PARTY_NOTICES.md`.
- Public exports: root, `./codemirror`, `./commands`, `./styles.css` and
  `./codemirror/styles.css`.

## Release

Update `package.json` version, run `npm run check`, then use the manual
`Publish npm package` workflow. The package requires its own npm trusted
publisher entry (OIDC); no token secret is stored. Regenerate the vendor
tarball when the engine peer version changes.

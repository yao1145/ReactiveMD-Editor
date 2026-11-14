import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const css = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

describe('mobile stylesheet', () => {
  const mobile = css('../src/mobile/mobile.css');

  it('scopes footer suppression to the paired editor instance', () => {
    const block = mobile.slice(mobile.indexOf('@media (max-width: 620px) {', mobile.indexOf('data-mobile-bar')));
    expect(mobile).toContain('.reactive-md-editor[data-mobile-bar] .editor-status-bar');
    expect(mobile).not.toContain(':root:has(');
    expect(block).toBeTruthy();
  });

  it('gives the standalone bar its own theme tokens', () => {
    expect(mobile).toContain('.mobile-doc-bar[data-editor-theme="dark"]');
    expect(mobile).toContain('.mobile-doc-bar[data-editor-theme="auto"]');
    expect(mobile).toContain('--md-bar-surface');
    // The bar is a sibling of the editor, so its rules cannot read the
    // editor-scoped tokens directly.
    expect(mobile).not.toMatch(/\.mobile-doc-title[^{]*\{[^}]*var\(--ink, /);
  });

  it('is loaded after the base stylesheet so narrow overrides win', () => {
    const root = css('../src/library.ts');
    const cm = css('../src/codemirror/library.ts');
    for (const entry of [root, cm]) {
      expect(entry.indexOf('mobile/mobile.css')).toBeGreaterThan(entry.indexOf('styles/editor.css'));
      expect(entry.indexOf('mobile/mobile.css')).toBeLessThan(entry.indexOf('codemirror.css'));
    }
    expect(css('../src/styles/editor.css')).not.toContain('mobile/mobile.css');
  });

  it('narrows the gutter and draws diagnostic markers as dots', () => {
    const block = mobile.slice(
      mobile.indexOf('/* Gutter and diagnostic markers'),
      mobile.indexOf('/* Container compact mode'),
    );
    // Line numbers and the marker column both shrink below the desktop metrics.
    expect(block).toContain('.cm-lineNumbers .cm-gutterElement');
    expect(block).toMatch(/min-width:\s*(?:9|10)px/);
    expect(block).toMatch(/\.cm-gutter-lint\s*\{[^}]*width:\s*11px/);
    // Dots replace the default svg artwork but keep the severity colours.
    expect(block).toContain('.cm-lint-marker-error::after');
    expect(block).toContain('.cm-lint-marker-warning::after');
    expect(block).toMatch(/\.cm-lint-marker-error\s*,\s*\.cm-lint-marker-warning\s*\{\s*content:\s*none/);
    expect(block).toContain('#d95050');
    expect(block).toContain('#ddab37');
    // The dot sits on the right edge of the gutter, next to the line number.
    expect(block).toMatch(/\.cm-gutter-lint \.cm-gutterElement[^}]*justify-content:\s*flex-end/);
  });
});

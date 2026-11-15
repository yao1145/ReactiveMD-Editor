import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const css = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

describe('mobile stylesheet', () => {
  const mobile = css('../../src/mobile/mobile.css');

  it('scopes footer suppression to the paired editor instance', () => {
    const block = mobile.slice(mobile.indexOf('@media (max-width: 760px) {', mobile.indexOf('data-mobile-bar')));
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
    const root = css('../../src/library.ts');
    const cm = css('../../src/codemirror/library.ts');
    for (const entry of [root, cm]) {
      expect(entry.indexOf('mobile/mobile.css')).toBeGreaterThan(entry.indexOf('styles/editor.css'));
      expect(entry.indexOf('mobile/mobile.css')).toBeLessThan(entry.indexOf('codemirror.css'));
    }
    expect(css('../../src/styles/editor.css')).not.toContain('mobile/mobile.css');
  });

  it('narrows the gutter and draws diagnostic markers as dots', () => {
    const block = mobile.slice(
      mobile.indexOf('/* Gutter and diagnostic markers'),
      mobile.indexOf('/* Touch gestures'),
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

  it('uses one narrow threshold across the mobile layer', () => {
    // The editor frame decides narrow layout; host-facing chrome uses the same
    // number on the viewport. No second width may creep back in.
    for (const literal of ['max-width: 620px', 'max-width: 640px', 'max-width: 600px', 'max-width: 500px']) {
      expect(mobile).not.toContain(literal);
    }
    expect(mobile).toContain('@container editor-frame (max-width: 760px)');
    expect(mobile).toContain('@media (max-width: 760px)');
  });

  it('keeps toolbar narrow-screen rules in the toolbar layer', () => {
    const toolbar = css('../../src/mobile/toolbar-compact.css');
    const base = css('../../src/components/editor-toolbar.css');

    // mobile.css stays the entry point and pulls the toolbar rules in.
    expect(mobile).toContain("@import './toolbar-compact.css';");
    expect(mobile.indexOf("@import './toolbar-compact.css';")).toBeLessThan(
      mobile.indexOf('.reactive-md-editor'),
    );

    // Compact labels, the overflow menu and the id-based hiding all live here.
    expect(toolbar).toContain('.editor-toolbar-mobile-only');
    expect(toolbar).toContain('.editor-toolbar-heading-label-compact');
    expect(toolbar).toContain('.editor-toolbar-more-menu');
    expect(toolbar).toContain('.editor-toolbar-more-item');
    expect(toolbar).toContain('.editor-toolbar-more-status');
    expect(toolbar).toContain('[data-toolbar-id="undo"]');
    expect(toolbar).toContain('[data-toolbar-id="redo"]');
    expect(toolbar).toContain('[data-toolbar-id="download"]');
    // Link lives only in the Insert menu, so no standalone toolbar node exists.
    expect(toolbar).not.toContain('[data-toolbar-id="link"]');
    // The desktop-only class is gone from the JSX, so nothing may select it.
    expect(toolbar).not.toContain('desktop-only');
    // One primary threshold follows the editor frame; 400 stays a density tier.
    expect(toolbar).toContain('@container editor-frame (max-width: 760px)');
    expect(toolbar).toContain('@media (max-width: 400px)');
    expect(toolbar).not.toContain('max-width: 640px');
    expect(toolbar).not.toContain('max-width: 500px');
    expect(toolbar).not.toContain('max-width: 600px');

    // The base component stylesheet carries desktop rules only.
    expect(base).not.toContain('editor-toolbar-mobile-only');
    expect(base).not.toContain('desktop-only');
    expect(base).not.toContain('heading-label-compact');
    expect(base).not.toContain('components-icon-compact');
    expect(base).not.toContain('components-label-compact');
    expect(base).not.toContain('max-width: 500px');
    expect(base).not.toContain('max-width: 640px');
    expect(base).not.toContain('max-width: 760px');
    expect(base).not.toContain('touch-action');
    expect(base).not.toContain('tap-highlight');
  });
});

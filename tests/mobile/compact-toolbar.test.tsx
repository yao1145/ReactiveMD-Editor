/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { EditorToolbar } from '../../src/components/editor-toolbar';
import type { CompactToolbarChrome } from '../../src/components/toolbar-compact';
import type { EditorSurface } from '../../src/contracts/surface';

const surface: EditorSurface = {
  read: () => ({ value: '', selection: { start: 0, end: 0 } }),
  element: () => null,
  subscribe: () => () => {},
  listenKeyDown: () => () => {},
};

const handlers = {
  onEdit: () => {},
  onUndo: () => {},
  onRedo: () => {},
};

/** Mirrors the shape the mobile layer supplies without importing it, so the
 * assertions describe the shared toolbar contract rather than mobile copy. */
const chrome: CompactToolbarChrome = {
  headingContent: (label, level) => (
    <>
      <span className="editor-toolbar-heading-label editor-toolbar-heading-label-full">
        {label}
      </span>
      <span
        className="editor-toolbar-heading-label editor-toolbar-heading-label-compact"
        aria-hidden="true"
      >
        {`compact:${level}`}
      </span>
    </>
  ),
  componentsContent: () => (
    <span className="chrome-components">chrome components</span>
  ),
  overflow: () => (
    <div className="editor-toolbar-slot editor-toolbar-mobile-only">
      <button
        type="button"
        data-toolbar-item="true"
        data-toolbar-id="more"
        className="editor-toolbar-button editor-toolbar-more-trigger"
      />
    </div>
  ),
  trackMenuPlacement: () => () => {},
};

function render(compact?: CompactToolbarChrome): string {
  return renderToStaticMarkup(
    <EditorToolbar
      editorSurface={surface}
      onEdit={handlers.onEdit}
      onUndo={handlers.onUndo}
      onRedo={handlers.onRedo}
      canUndo={false}
      canRedo={false}
      compact={compact}
    />,
  );
}

describe('EditorToolbar compact chrome', () => {
  it('renders the overflow trigger inside the mobile-only slot', () => {
    const html = render(chrome);
    expect(html).toContain('editor-toolbar-mobile-only');
    expect(html).toContain('data-toolbar-id="more"');
    expect(html).toContain('editor-toolbar-more-trigger');
    expect(html).toMatch(
      /class="editor-toolbar-slot editor-toolbar-mobile-only"[\s\S]*?data-toolbar-id="more"/,
    );
  });

  it('renders both heading labels through the chrome', () => {
    const html = render(chrome);
    expect(html).toContain('editor-toolbar-heading-label-full');
    expect(html).toContain('editor-toolbar-heading-label-compact');
    // Body is the initial heading state, so the compact label is level 0.
    expect(html).toContain('compact:0');
    expect(html).toContain('Body');
  });

  it('renders the components content supplied by the chrome', () => {
    const html = render(chrome);
    expect(html).toContain('chrome-components');
  });

  it('omits the mobile-only trigger and compact heading without chrome', () => {
    const html = render();
    expect(html).not.toContain('editor-toolbar-mobile-only');
    expect(html).not.toContain('data-toolbar-id="more"');
    expect(html).toContain('class="editor-toolbar-heading-label"');
    expect(html).not.toContain('editor-toolbar-heading-label-full');
    expect(html).not.toContain('editor-toolbar-heading-label-compact');
  });

  it('keeps the desktop components trigger without chrome', () => {
    const html = render();
    expect(html).toContain('editor-toolbar-components-label');
    expect(html).toContain('Components');
    expect(html).not.toContain('chrome-components');
  });

  it('never emits a desktop-only marker', () => {
    expect(render(chrome)).not.toContain('editor-toolbar-desktop-only');
    expect(render()).not.toContain('editor-toolbar-desktop-only');
  });
});

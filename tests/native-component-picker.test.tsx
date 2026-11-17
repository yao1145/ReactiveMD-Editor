/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EditorToolbar } from '../src/components/editor-toolbar';
import type { EditorSurface } from '../src/contracts/surface';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let root: Root | null = null;
let host: HTMLDivElement | null = null;

afterEach(() => {
  if (root) act(() => root?.unmount());
  root = null;
  host?.remove();
  host = null;
});

describe('native component picker', () => {
  it('opens the catalog and filters it independently from toolbar menu state', () => {
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    const surface: EditorSurface = {
      read: () => ({ value: '', selection: { start: 0, end: 0 } }),
      element: () => null,
      subscribe: () => () => {},
      listenKeyDown: () => () => {},
    };
    const onEdit = vi.fn();

    act(() => root?.render(
      <EditorToolbar
        editorSurface={surface}
        onEdit={onEdit}
        onUndo={() => {}}
        onRedo={() => {}}
        canUndo={false}
        canRedo={false}
      />,
    ));

    act(() => host?.querySelector<HTMLButtonElement>('[data-toolbar-id="components"]')?.click());
    expect(host?.querySelector('[role="dialog"][aria-label="Insert native component"]')).not.toBeNull();
    expect(host?.querySelectorAll('[role="menuitem"].editor-toolbar-native-item').length).toBeGreaterThan(0);

    const search = host?.querySelector<HTMLInputElement>('.editor-toolbar-search-input');
    expect(search).not.toBeNull();
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(
        search,
        'no-component-can-match-this',
      );
      search!.dispatchEvent(new Event('input', { bubbles: true }));
    });

    expect(host?.textContent).toContain('No matching components');
    expect(host?.querySelectorAll('.editor-toolbar-native-item')).toHaveLength(0);

    // Reopening clears the query and committing delegates the pure edit to the host.
    act(() => host?.querySelector<HTMLButtonElement>('[data-toolbar-id="components"]')?.click());
    act(() => host?.querySelector<HTMLButtonElement>('[data-toolbar-id="components"]')?.click());
    expect(host?.querySelector<HTMLInputElement>('.editor-toolbar-search-input')?.value).toBe('');
    const first = host?.querySelector<HTMLButtonElement>('.editor-toolbar-native-item');
    expect(first).not.toBeNull();
    act(() => first?.click());
    expect(onEdit).toHaveBeenCalledTimes(1);
    const edit = onEdit.mock.calls[0][0];
    expect(edit.value.length).toBeGreaterThan(0);
    expect(edit.selection.start).toBeGreaterThanOrEqual(0);
    expect(edit.selection.end).toBeLessThanOrEqual(edit.value.length);
    expect(host?.querySelector('.editor-toolbar-native-menu')).toBeNull();
  });
});

/** @vitest-environment jsdom */
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { EditorLocale } from '../../src/contracts/types';
import { useCompactToolbarChrome } from '../../src/mobile/compact-toolbar';

/** Deliberately outside any `EditorLocaleProvider`: the hook must read the
 * locale it is given, not the context default. */
function Probe({ locale }: { locale: EditorLocale }) {
  const chrome = useCompactToolbarChrome(locale);
  const menuRef = createRef<HTMLDivElement>();
  return (
    <div>
      {chrome.componentsContent()}
      {chrome.overflow({
        menuId: 'more-menu',
        menuRef,
        open: true,
        placement: null,
        tabStop: false,
        onFocus: () => {},
        onToggle: () => {},
        onKeyDown: () => {},
        disabled: false,
        canUndo: true,
        canRedo: false,
        onUndo: () => {},
        onRedo: () => {},
        showExport: true,
        onExport: () => {},
        status: undefined,
      })}
    </div>
  );
}

function render(locale: EditorLocale): string {
  return renderToStaticMarkup(<Probe locale={locale} />);
}

describe('useCompactToolbarChrome locale', () => {
  it('renders Chinese copy from the explicit locale argument', () => {
    const html = render('zh');
    expect(html).toContain('组件');
    expect(html).toContain('更多');
    expect(html).toContain('更多操作');
    expect(html).toContain('撤销');
    expect(html).toContain('重做');
    expect(html).toContain('导出');
    expect(html).not.toContain('Components');
    expect(html).not.toContain('More');
    expect(html).not.toContain('More actions');
  });

  it('renders English copy from the explicit locale argument', () => {
    const html = render('en');
    expect(html).toContain('Components');
    expect(html).toContain('More');
    expect(html).toContain('More actions');
    expect(html).toContain('Undo');
    expect(html).toContain('Redo');
    expect(html).toContain('Export');
    expect(html).not.toContain('组件');
    expect(html).not.toContain('更多');
    expect(html).not.toContain('撤销');
  });
});

/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MobileDocBar } from '../src/mobile/mobile-doc-bar';

const labels = { edit: 'Edit', preview: 'Preview', viewSwitch: 'Editor view' };

describe('MobileDocBar', () => {
  it('marks itself for the paired editor and exposes the view switch', () => {
    const html = renderToStaticMarkup(
      <MobileDocBar title="Document" view="preview" onViewChange={() => {}} labels={labels} />,
    );
    expect(html).toContain('data-mobile-doc-bar');
    expect(html).toContain('data-mobile-view-option="edit"');
    expect(html).toContain('data-mobile-view-option="preview"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('Document');
  });

  it('carries the editor theme so it does not depend on host tokens', () => {
    expect(renderToStaticMarkup(
      <MobileDocBar title="Document" view="edit" onViewChange={() => {}} labels={labels} theme="dark" />,
    )).toContain('data-editor-theme="dark"');
    expect(renderToStaticMarkup(
      <MobileDocBar title="Document" view="edit" onViewChange={() => {}} labels={labels} theme="auto" />,
    )).toContain('data-editor-theme="auto"');
    expect(renderToStaticMarkup(
      <MobileDocBar title="Document" view="edit" onViewChange={() => {}} labels={labels} />,
    )).not.toContain('data-editor-theme');
  });
});

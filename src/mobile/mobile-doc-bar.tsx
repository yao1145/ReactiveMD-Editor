import type {EditorTheme,EditorViewMode} from '../contracts/types';

export interface MobileDocBarLabels {
  edit: string;
  preview: string;
  viewSwitch: string;
}

/** Narrow-screen document header: identity on the left, the primary view
 * switch on the right.

 * The bar is usually a sibling of the editor, so it cannot inherit the
 * editor's tokens. Pass the same `theme` the editor uses; without it the bar
 * follows the host page's variables.
 *
 * Pair it with `<ReactiveMarkdownEditor mobileBar />` so that editor hides its
 * own footer switch and character count on phones instead of showing both. */
export function MobileDocBar({title,view,onViewChange,labels,theme}:{
  title: string;
  view: EditorViewMode;
  onViewChange(view: EditorViewMode): void;
  labels: MobileDocBarLabels;
  theme?: EditorTheme;
}) {
  return <div className="mobile-doc-bar" data-mobile-doc-bar="" data-editor-theme={theme}>
    <div className="mobile-doc-title">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5Z" />
        <path d="M14 3v5h4.5M8.5 12h7M8.5 16h5" />
      </svg>
      <span>{title}</span>
    </div>
    <div className="mobile-view-switch" role="group" aria-label={labels.viewSwitch}>
      <button type="button" data-mobile-view-option="edit" aria-pressed={view!=='preview'} onClick={()=>onViewChange('edit')}>
        {labels.edit}
      </button>
      <button type="button" data-mobile-view-option="preview" aria-pressed={view==='preview'} onClick={()=>onViewChange('preview')}>
        {labels.preview}
      </button>
    </div>
  </div>;
}

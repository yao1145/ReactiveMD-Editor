import {useMemo} from 'react';
import type {EditorLocale} from '../contracts/types';
import {EDITOR_TOOLBAR_COPY} from '../localization/editor-i18n';
import {COMPACT_TOOLBAR_COPY} from './compact-toolbar-copy';
import {trackCompactMenuPlacement} from './use-compact-menu-placement';
import {
  Icon,
  ToolbarButton,
  keepEditorFocus,
  moveMenuFocus,
} from '../components/toolbar-parts';
import type {CompactToolbarChrome,CompactToolbarOverflowProps} from '../components/toolbar-compact';

/** Mobile-only presentation the shared toolbar renders through
 * `CompactToolbarChrome`.

 * Everything here is DOM and copy for narrow frames. State, history and
 * command dispatch stay in `editor-toolbar.tsx`, which passes them down as
 * overflow props. */
export function useCompactToolbarChrome(locale: EditorLocale): CompactToolbarChrome {
  const copy=EDITOR_TOOLBAR_COPY[locale];
  const compactCopy=COMPACT_TOOLBAR_COPY[locale];

  return useMemo<CompactToolbarChrome>(()=>({
    headingContent(label,level){
      return (
        <>
          <span className="editor-toolbar-heading-label editor-toolbar-heading-label-full">
            {label}
          </span>
          <span
            className="editor-toolbar-heading-label editor-toolbar-heading-label-compact"
            aria-hidden="true"
          >
            {level===0?'¶':`H${level}`}
          </span>
        </>
      );
    },
    componentsContent(){
      return (
        <>
          <Icon name="sparkle" className="editor-toolbar-components-icon-full" />
          <Icon name="sparkle" className="editor-toolbar-components-icon-compact" />
          <span className="editor-toolbar-components-label editor-toolbar-components-label-full">
            {copy.componentsLabel}
          </span>
          <span className="editor-toolbar-components-label editor-toolbar-components-label-compact">
            {compactCopy.componentsCompactLabel}
          </span>
        </>
      );
    },
    overflow(props: CompactToolbarOverflowProps){
      return (
        <div className="editor-toolbar-slot editor-toolbar-mobile-only">
          <ToolbarButton
            toolbarId="more"
            label={compactCopy.more}
            className="editor-toolbar-more-trigger"
            tabStop={props.tabStop}
            onFocus={props.onFocus}
            disabled={props.disabled}
            popup="menu"
            expanded={props.open}
            controls={props.menuId}
            onClick={props.onToggle}
            onKeyDown={props.onKeyDown}
          >
            <Icon name="more" />
          </ToolbarButton>
          {props.open ? (
            <div
              id={props.menuId}
              ref={props.menuRef}
              className="editor-toolbar-popover editor-toolbar-more-menu"
              role="menu"
              aria-label={compactCopy.moreMenuLabel}
              style={props.placement ?? undefined}
              onKeyDown={(event)=>moveMenuFocus(event,props.menuRef.current)}
            >
              {props.status ? (
                <div className="editor-toolbar-more-status">{props.status}</div>
              ) : null}
              <button
                type="button"
                role="menuitem"
                tabIndex={-1}
                className="editor-toolbar-menu-item editor-toolbar-more-item"
                disabled={!props.canUndo}
                onMouseDown={keepEditorFocus}
                onClick={props.onUndo}
              >
                <Icon name="undo" className="editor-toolbar-menu-icon" />
                <span>{copy.undo}</span>
              </button>
              <button
                type="button"
                role="menuitem"
                tabIndex={-1}
                className="editor-toolbar-menu-item editor-toolbar-more-item"
                disabled={!props.canRedo}
                onMouseDown={keepEditorFocus}
                onClick={props.onRedo}
              >
                <Icon name="redo" className="editor-toolbar-menu-icon" />
                <span>{copy.redo}</span>
              </button>
              {props.showExport ? (
                <button
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  className="editor-toolbar-menu-item editor-toolbar-more-item"
                  onMouseDown={keepEditorFocus}
                  onClick={props.onExport}
                >
                  <Icon name="download" className="editor-toolbar-menu-icon" />
                  <span>{copy.download}</span>
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      );
    },
    trackMenuPlacement(menu,trigger,apply){
      return trackCompactMenuPlacement(menu,trigger,apply);
    },
  }),[copy,compactCopy]);
}

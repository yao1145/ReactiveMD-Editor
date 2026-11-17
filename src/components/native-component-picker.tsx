import { useEffect, useMemo, useState, type KeyboardEvent, type RefObject } from 'react';
import {
  createLocalComponentCatalogForOptions,
  filterLocalComponentCatalog,
  insertLocalComponentFromOptions,
  localCatalogAncestors,
  localComponentCatalogGroups,
  localComponentCatalogKey,
  localComponentHelp,
  type LocalComponentCatalogEntry,
  type LocalCompileOptions,
} from 'reactive-md/authoring';
import { localCompileOptionsKey } from 'reactive-md';
import type { EditorEdit } from '../authoring/editor-commands';
import { EDITOR_TOOLBAR_COPY } from '../localization/editor-i18n';
import type { EditorSurface } from '../contracts/surface';
import type { EditorLocale } from '../contracts/types';
import { Icon, ToolbarButton, keepEditorFocus, moveMenuFocus } from './toolbar-parts';
import type { CompactToolbarChrome } from './toolbar-compact';

interface NativeComponentPickerProps {
  editorSurface: EditorSurface;
  compileOptions?: LocalCompileOptions;
  locale: EditorLocale;
  compact?: CompactToolbarChrome;
  disabled: boolean;
  open: boolean;
  tabStop: boolean;
  menuId: string;
  menuPanelRef: RefObject<HTMLDivElement | null>;
  searchRef: RefObject<HTMLInputElement | null>;
  searchReset: number;
  onFocus(): void;
  onToggle(): void;
  onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>): void;
  onClose(): void;
  onInsert(edit: EditorEdit): void;
}

/** Component catalog and its search surface; the parent owns toolbar/menu coordination. */
export function NativeComponentPicker({
  editorSurface,
  compileOptions,
  locale,
  compact,
  disabled,
  open,
  tabStop,
  menuId,
  menuPanelRef,
  searchRef,
  searchReset,
  onFocus,
  onToggle,
  onTriggerKeyDown,
  onClose,
  onInsert,
}: NativeComponentPickerProps) {
  const copy = EDITOR_TOOLBAR_COPY[locale];
  const [query, setQuery] = useState('');
  const [ancestors, setAncestors] = useState<readonly string[]>([]);
  const compileKey = localCompileOptionsKey(compileOptions);
  // Catalog identity also includes authoring copy, outside the semantic key.
  const optionsKey = useMemo(() => localComponentCatalogKey(compileOptions, locale), [compileOptions, locale, compileKey]);
  const catalog = useMemo(() => {
    try {
      return createLocalComponentCatalogForOptions(compileOptions, locale);
    } catch {
      // Preserve the editor when an external insertion template fails validation.
      return createLocalComponentCatalogForOptions(undefined, locale);
    }
  }, [optionsKey]);
  const groups = useMemo(() => localComponentCatalogGroups(
    filterLocalComponentCatalog(catalog, { query, ancestors }),
  ), [catalog, ancestors, query]);

  useEffect(() => {
    setQuery('');
  }, [searchReset]);

  useEffect(() => {
    if (!open) return;
    const { value, selection } = editorSurface.read();
    setAncestors(localCatalogAncestors(value, selection.start, compileOptions));
  }, [open, editorSurface, compileOptions]);

  const insert = (entry: LocalComponentCatalogEntry) => {
    if (disabled) return;
    const { value, selection } = editorSurface.read();
    onInsert(insertLocalComponentFromOptions(compileOptions, entry.id, value, selection, locale));
  };

  return (
    <div className="editor-toolbar-slot editor-toolbar-slot-native">
      <ToolbarButton
        toolbarId="components"
        label={copy.componentsTriggerLabel}
        className="editor-toolbar-components-trigger"
        tabStop={tabStop}
        onFocus={onFocus}
        disabled={disabled}
        popup="dialog"
        expanded={open}
        controls={menuId}
        onClick={onToggle}
        onKeyDown={onTriggerKeyDown}
      >
        {compact?.componentsContent() ?? (
          <>
            <Icon name="sparkle" />
            <span className="editor-toolbar-components-label">{copy.componentsLabel}</span>
          </>
        )}
      </ToolbarButton>
      {open ? (
        <div
          id={menuId}
          ref={menuPanelRef}
          className="editor-toolbar-popover editor-toolbar-native-menu"
          role="dialog"
          aria-label={copy.nativeMenuLabel}
          onKeyDown={(event) => moveMenuFocus(event, menuPanelRef.current)}
        >
          <div className="editor-toolbar-native-head">
            <span className="editor-toolbar-native-title">{copy.nativeTitle}</span>
            <button
              type="button"
              className="editor-toolbar-close"
              aria-label={copy.closeNativeLabel}
              onMouseDown={keepEditorFocus}
              onClick={onClose}
            >
              <Icon name="close" />
            </button>
          </div>
          <div className="editor-toolbar-search">
            <Icon name="search" className="editor-toolbar-search-icon" />
            <input
              ref={searchRef}
              type="search"
              className="editor-toolbar-search-input"
              value={query}
              placeholder={copy.searchPlaceholder}
              aria-label={copy.searchLabel}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="editor-toolbar-native-scroll" role="menu" aria-label={copy.nativeListLabel}>
            {groups.length === 0 ? (
              <p className="editor-toolbar-menu-empty">{copy.noMatchingComponents}</p>
            ) : (
              groups.map((group) => (
                <div key={group.id} className="editor-toolbar-native-group" role="group" aria-label={group.label}>
                  <div className="editor-toolbar-native-group-title" aria-hidden="true">{group.label}</div>
                  {group.entries.map((entry) => {
                    const help = localComponentHelp(entry);
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        role="menuitem"
                        tabIndex={-1}
                        className="editor-toolbar-native-item"
                        title={help === '' ? undefined : help}
                        aria-description={help === '' ? undefined : help}
                        onMouseDown={keepEditorFocus}
                        onClick={() => insert(entry)}
                      >
                        <span className="editor-toolbar-native-copy">
                          <span className="editor-toolbar-native-label">
                            {entry.title}
                            {entry.inline ? <span className="editor-toolbar-native-badge">{copy.inlineBadge}</span> : null}
                          </span>
                          <span className="editor-toolbar-native-description">{entry.description}</span>
                        </span>
                        <Icon name="plus" className="editor-toolbar-native-add" />
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Editor toolbar for the Reactive MD editor.
 *
 * The toolbar only reads the source surface and hands pure `EditorEdit` results
 * back to the editor. The editor owns history, focus restoration and the
 * controlled value. Format state is derived from the current selection so the
 * toolbar reflects the block and inline formatting under the caret.
 *
 * The toolbar is width-agnostic: it renders the full desktop control set and
 * accepts an optional `CompactToolbarChrome` from the mobile layer for the
 * narrow-frame triggers and overflow menu. `codemirror/` supplies it.
 */

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  formatBold,
  formatItalic,
  formatStrike,
  formatInlineCode,
  formatHeading,
  formatBulletList,
  formatOrderedList,
  formatTaskList,
  formatQuote,
  indentSelection,
  outdentSelection,
  insertLink,
  insertImage,
  insertCodeBlock,
  insertTable,
  insertDivider,
  insertText,
  readFormatState,
  type EditorEdit,
  type EditorFormatState,
} from '../authoring/editor-commands';
import type { LocalCompileOptions } from 'reactive-md/authoring';
import { useEditorLocale } from '../localization/locale';
import { EDITOR_TOOLBAR_COPY } from '../localization/editor-i18n';
import type { EditorLocale } from '../contracts/types';
import {type EditorSurface} from '../contracts/surface';
import {Icon,ToolbarButton,getMenuItems,moveMenuFocus,keepEditorFocus,type IconName,type MenuEdge} from './toolbar-parts';
import type {CompactToolbarChrome} from './toolbar-compact';
import { NativeComponentPicker } from './native-component-picker';

export interface EditorToolbarProps {
  editorSurface: EditorSurface;
  onEdit(edit: EditorEdit): void;
  onUndo(): void;
  onRedo(): void;
  canUndo: boolean;
  canRedo: boolean;
  onExport?(): void;
  /** Render the download action only when the host supplies a handler. */
  showExport?: boolean;
  /** Read-only and disabled editors leave every action without effect. */
  disabled?: boolean;
  /** Same compile options as the preview; drives the component catalog. */
  compileOptions?: LocalCompileOptions;
  /** Host content at the far left of the toolbar. */
  leading?: ReactNode;
  /** Host content immediately before the history controls. */
  status?: ReactNode;
  /** Narrow-screen triggers and overflow supplied by the mobile layer. */
  compact?: CompactToolbarChrome;
}

type TextSelection = { start: number; end: number };
type MenuId = 'emoji' | 'heading' | 'insert' | 'list' | 'more' | 'native';
type HeadingLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type SimpleCommand = (
  value: string,
  selection: TextSelection,
  locale?: EditorLocale,
) => EditorEdit;
const EMOJIS = [
  '😀', '😄', '😁', '😊', '🙂', '😉', '😍', '🤔',
  '😎', '😅', '😂', '🥳', '👍', '👎', '👏', '🙏',
  '💡', '✅', '❌', '⚠️', '🔥', '⭐', '🎉', '❤️',
  '💬', '📌', '🚀', '📈', '📉', '🧩', '⚙️', '🔍',
  '📎', '🗂️', '🕒', '✨',
] as const;

const HEADING_ITEMS: readonly { level: HeadingLevel; sample: string }[] = [
  { level: 0, sample: '¶' },
  { level: 1, sample: 'H1' },
  { level: 2, sample: 'H2' },
  { level: 3, sample: 'H3' },
  { level: 4, sample: 'H4' },
  { level: 5, sample: 'H5' },
  { level: 6, sample: 'H6' },
];

interface ListOption {
  type: 'bullet' | 'ordered' | 'task';
  icon: IconName;
  command: SimpleCommand;
}

const LIST_OPTIONS: readonly ListOption[] = [
  { type: 'bullet', icon: 'bulletList', command: formatBulletList },
  { type: 'ordered', icon: 'orderedList', command: formatOrderedList },
  { type: 'task', icon: 'taskList', command: formatTaskList },
];

const LIST_ACTIONS: readonly {
  labelKey: 'decreaseIndent' | 'increaseIndent';
  icon: IconName;
  command: SimpleCommand;
}[] = [
  { labelKey: 'decreaseIndent', icon: 'outdent', command: outdentSelection },
  { labelKey: 'increaseIndent', icon: 'indent', command: indentSelection },
];

interface InsertItem {
  labelKey: keyof typeof EDITOR_TOOLBAR_COPY.en.insertItems;
  icon: IconName;
  command: SimpleCommand;
}

const INSERT_ITEMS: readonly InsertItem[] = [
  { labelKey: 'link', icon: 'link', command: insertLink },
  { labelKey: 'image', icon: 'image', command: insertImage },
  { labelKey: 'table', icon: 'table', command: insertTable },
  { labelKey: 'divider', icon: 'divider', command: insertDivider },
  { labelKey: 'codeBlock', icon: 'codeBlock', command: insertCodeBlock },
  { labelKey: 'inlineCode', icon: 'inlineCode', command: formatInlineCode },
  { labelKey: 'strikethrough', icon: 'strike', command: formatStrike },
  { labelKey: 'quote', icon: 'quote', command: formatQuote },
];

const INITIAL_FORMAT_STATE: EditorFormatState = {
  headingLevel: 0,
  bold: false,
  italic: false,
  strike: false,
  inlineCode: false,
  list: null,
  quote: false,
};

function readEditor(surface: EditorSurface) {
  const {value,selection}=surface.read();
  return {value,selection,selectedText:value.slice(selection.start,selection.end)};
}

function sameFormatState(a: EditorFormatState, b: EditorFormatState): boolean {
  return (
    a.headingLevel === b.headingLevel &&
    a.bold === b.bold &&
    a.italic === b.italic &&
    a.strike === b.strike &&
    a.inlineCode === b.inlineCode &&
    a.list === b.list &&
    a.quote === b.quote
  );
}

function getToolbarButtons(container: HTMLElement | null): HTMLButtonElement[] {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll<HTMLButtonElement>('[data-toolbar-item]'),
  ).filter((button) => !button.disabled && button.getClientRects().length > 0);
}

function moveEmojiFocus(
  event: ReactKeyboardEvent<HTMLElement>,
  grid: HTMLElement | null,
): void {
  if (!grid) return;
  const cells = Array.from(grid.querySelectorAll<HTMLButtonElement>('.editor-toolbar-emoji'));
  if (cells.length === 0) return;
  const active = document.activeElement as HTMLButtonElement | null;
  const index = active ? cells.indexOf(active) : -1;
  if (index < 0) return;
  const columns = 8;
  let next = index;

  switch (event.key) {
    case 'ArrowRight':
      next = Math.min(index + 1, cells.length - 1);
      break;
    case 'ArrowLeft':
      next = Math.max(index - 1, 0);
      break;
    case 'ArrowDown':
      next = Math.min(index + columns, cells.length - 1);
      break;
    case 'ArrowUp':
      next = Math.max(index - columns, 0);
      break;
    case 'Home':
      next = 0;
      break;
    case 'End':
      next = cells.length - 1;
      break;
    default:
      return;
  }

  event.preventDefault();
  cells[next]?.focus();
}

export function EditorToolbar({
  editorSurface,
  onEdit,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onExport,
  showExport = false,
  disabled = false,
  compileOptions,
  leading,
  status,
  compact,
}: EditorToolbarProps): ReactElement {
  const inputSurface=editorSurface;
  const rootRef = useRef<HTMLDivElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const emojiGridRef = useRef<HTMLDivElement>(null);
  const pendingMenuFocus = useRef<MenuEdge | null>(null);
  const formatFrame = useRef<number | null>(null);
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null);
  const [tabStopId, setTabStopId] = useState('heading');
  const [searchReset, setSearchReset] = useState(0);
  const [formatState, setFormatState] = useState<EditorFormatState>(INITIAL_FORMAT_STATE);
  const [menuPlacement, setMenuPlacement] = useState<CSSProperties | null>(null);
  const idPrefix = useId();
  const emojiMenuId = `${idPrefix}-emoji-menu`;
  const headingMenuId = `${idPrefix}-heading-menu`;
  const listMenuId = `${idPrefix}-list-menu`;
  const insertMenuId = `${idPrefix}-insert-menu`;
  const moreMenuId = `${idPrefix}-more-menu`;
  const nativeMenuId = `${idPrefix}-native-menu`;
  const locale = useEditorLocale();
  const copy = EDITOR_TOOLBAR_COPY[locale];
  const headingItems = HEADING_ITEMS.map((item) => ({
    ...item,
    label: copy.headingLabels[item.level],
  }));
  const listOptions = LIST_OPTIONS.map((item) => ({
    ...item,
    label: copy.listLabels[item.type],
  }));
  const listActions = LIST_ACTIONS.map((item) => ({
    ...item,
    label: copy[item.labelKey],
  }));
  const insertItems = INSERT_ITEMS.map((item) => ({
    ...item,
    label: copy.insertItems[item.labelKey],
  }));

  const syncFormatState = useCallback(() => {
    if (!inputSurface.element()) {
      setFormatState(INITIAL_FORMAT_STATE);
      return;
    }
    const {value,selection}=inputSurface.read();
    const next = readFormatState(value,selection);
    setFormatState((current) => (sameFormatState(current, next) ? current : next));
  }, [inputSurface]);

  const queueFormatSync = useCallback(() => {
    if (formatFrame.current !== null) window.cancelAnimationFrame(formatFrame.current);
    formatFrame.current = window.requestAnimationFrame(() => {
      formatFrame.current = null;
      syncFormatState();
    });
  }, [syncFormatState]);

  useEffect(() => {
    const release=inputSurface.subscribe(syncFormatState);
    syncFormatState();
    return release;
  }, [inputSurface, syncFormatState]);

  useEffect(() => {
    return () => {
      if (formatFrame.current !== null) window.cancelAnimationFrame(formatFrame.current);
    };
  }, []);

  const getMenuTrigger = useCallback((menu: MenuId): HTMLButtonElement | null => {
    const id = menu === 'emoji' ? 'insert' : menu === 'native' ? 'components' : menu;
    return rootRef.current?.querySelector<HTMLButtonElement>(`[data-toolbar-id="${id}"]`) ?? null;
  }, []);

  // Placement belongs to the mobile layer; without it the stylesheet position
  // applies. The effect still runs unconditionally so hook order is stable.
  const measureMenu = compact?.trackMenuPlacement;
  useEffect(() => {
    if (!measureMenu) {
      setMenuPlacement(null);
      return;
    }
    const menu = openMenu && openMenu !== 'native' && openMenu !== 'emoji' ? openMenu : null;
    return measureMenu(menu, menu ? getMenuTrigger(menu) : null, setMenuPlacement);
  }, [openMenu, measureMenu, getMenuTrigger]);

  useEffect(() => {
    if (!openMenu) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      const menu = openMenu;
      setOpenMenu(null);
      getMenuTrigger(menu)?.focus();
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [openMenu, getMenuTrigger]);

  useEffect(() => {
    if (!openMenu) return;
    const edge = pendingMenuFocus.current;
    pendingMenuFocus.current = null;
    const frame = window.requestAnimationFrame(() => {
      const panel = menuPanelRef.current;
      if (edge) {
        const items = getMenuItems(panel);
        (edge === 'first' ? items[0] : items[items.length - 1])?.focus();
      } else if (openMenu === 'native') {
        searchRef.current?.focus();
      } else if (openMenu === 'emoji') {
        getMenuItems(panel)[0]?.focus();
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [openMenu]);

  const syncTabStop = useCallback(() => {
    const items = getToolbarButtons(rootRef.current);
    if (items.length === 0) return;
    setTabStopId((current) => {
      if (items.some((item) => item.dataset.toolbarId === current)) return current;
      return items[0]?.dataset.toolbarId ?? 'heading';
    });
  }, []);

  useEffect(() => {
    syncTabStop();
    window.addEventListener('resize', syncTabStop);
    return () => window.removeEventListener('resize', syncTabStop);
  }, [syncTabStop]);

  useEffect(() => {
    syncTabStop();
  }, [openMenu, canUndo, canRedo, syncTabStop]);

  const commitEdit = useCallback(
    (edit: EditorEdit) => {
      if (disabled) return;
      setOpenMenu(null);
      onEdit(edit);
      queueFormatSync();
    },
    [disabled, onEdit, queueFormatSync],
  );

  const applySimple = (command: SimpleCommand) => {
    if (disabled) return;
    const { value, selection } = readEditor(inputSurface);
    commitEdit(command(value, selection, locale));
  };

  const applyHeading = (level: HeadingLevel) => {
    if (disabled) return;
    const { value, selection } = readEditor(inputSurface);
    commitEdit(formatHeading(value, selection, level));
  };

  const applyEmoji = (emoji: string) => {
    if (disabled) return;
    const { value, selection } = readEditor(inputSurface);
    commitEdit(insertText(value, selection, emoji));
  };

  const handleUndo = () => {
    if (disabled) return;
    setOpenMenu(null);
    onUndo();
    queueFormatSync();
  };

  const handleRedo = () => {
    if (disabled) return;
    setOpenMenu(null);
    onRedo();
    queueFormatSync();
  };

  const handleExport = () => {
    setOpenMenu(null);
    if (!showExport) return;
    onExport?.();
  };

  const toggleMenu = (menu: MenuId) => {
    setOpenMenu((current) => (current === menu ? null : menu));
    if (menu === 'native') setSearchReset(value => value + 1);
  };

  const openMenuFromKeyboard = (
    menu: MenuId,
    event: ReactKeyboardEvent<HTMLButtonElement>,
    edge: MenuEdge,
  ) => {
    event.preventDefault();
    if (menu === 'native') setSearchReset(value => value + 1);
    if (openMenu === menu) {
      const items = getMenuItems(menuPanelRef.current);
      (edge === 'first' ? items[0] : items[items.length - 1])?.focus();
      return;
    }
    pendingMenuFocus.current = edge;
    setOpenMenu(menu);
  };

  const handleTriggerKeyDown = (
    menu: MenuId,
    event: ReactKeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    openMenuFromKeyboard(menu, event, event.key === 'ArrowDown' ? 'first' : 'last');
  };

  const handleToolbarKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest<HTMLButtonElement>('[data-toolbar-item]');
    if (!button || button !== target) return;

    const items = getToolbarButtons(rootRef.current);
    const index = items.indexOf(button);
    if (index < 0) return;

    let next = index;
    switch (event.key) {
      case 'ArrowLeft':
        next = (index - 1 + items.length) % items.length;
        break;
      case 'ArrowRight':
        next = (index + 1) % items.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = items.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    if (openMenu) setOpenMenu(null);
    items[next]?.focus();
  };

  const closeNativePicker = () => {
    setOpenMenu(null);
    getMenuTrigger('native')?.focus();
  };

  const headingLabel =
    headingItems.find((item) => item.level === formatState.headingLevel)?.label ??
    copy.headingLabels[0];
  const headingContent =
    compact?.headingContent(headingLabel, formatState.headingLevel) ?? (
      <span className="editor-toolbar-heading-label">{headingLabel}</span>
    );
  const headingLabelText = copy.headingLevelLabel(headingLabel);
  const currentListLabel = formatState.list ? copy.listLabels[formatState.list] : null;
  const listLabel = currentListLabel ? copy.listLabelWithType(currentListLabel) : copy.listLabel;
  const listIcon: IconName =
    formatState.list === 'ordered'
      ? 'orderedList'
      : formatState.list === 'task'
        ? 'taskList'
        : 'bulletList';

  return (
    <div
      className={`editor-toolbar${openMenu ? ' is-menu-open' : ''}`}
      role="toolbar"
      aria-label={copy.toolbarLabel}
      aria-orientation="horizontal"
      aria-disabled={disabled || undefined}
      ref={rootRef}
      onKeyDown={handleToolbarKeyDown}
    >
      {leading ? <div className="editor-toolbar-host-leading">{leading}</div> : null}
      <div className="editor-toolbar-slot">
        <ToolbarButton
          toolbarId="heading"
          label={headingLabelText}
          className="editor-toolbar-heading-trigger"
          active={formatState.headingLevel > 0}
          tabStop={tabStopId === 'heading'}
          onFocus={() => setTabStopId('heading')}
          disabled={disabled}
          popup="menu"
          expanded={openMenu === 'heading'}
          controls={headingMenuId}
          onClick={() => toggleMenu('heading')}
          onKeyDown={(event) => handleTriggerKeyDown('heading', event)}
        >
          {headingContent}
          <Icon name="chevron" className="editor-toolbar-chevron" />
        </ToolbarButton>
        {openMenu === 'heading' ? (
          <div
            id={headingMenuId}
            ref={menuPanelRef}
            className="editor-toolbar-popover editor-toolbar-heading-menu"
            role="menu"
            aria-label={copy.headingMenuLabel}
            style={menuPlacement ?? undefined}
            onKeyDown={(event) => moveMenuFocus(event, menuPanelRef.current)}
          >
            {headingItems.map((item) => (
              <button
                key={item.level}
                type="button"
                role="menuitemradio"
                aria-checked={formatState.headingLevel === item.level}
                tabIndex={-1}
                className="editor-toolbar-menu-item editor-toolbar-heading-item"
                onMouseDown={keepEditorFocus}
                onClick={() => applyHeading(item.level)}
              >
                <span
                  className={`editor-toolbar-heading-sample is-level-${item.level}`}
                  aria-hidden="true"
                >
                  {item.sample}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <ToolbarButton
        toolbarId="bold"
        label={copy.bold}
        tabStop={tabStopId === 'bold'}
        onFocus={() => setTabStopId('bold')}
        disabled={disabled}
        onClick={() => applySimple(formatBold)}
        pressed={formatState.bold}
        active={formatState.bold}
      >
        <span className="editor-toolbar-glyph is-bold" aria-hidden="true">B</span>
      </ToolbarButton>
      <ToolbarButton
        toolbarId="italic"
        label={copy.italic}
        tabStop={tabStopId === 'italic'}
        onFocus={() => setTabStopId('italic')}
        disabled={disabled}
        onClick={() => applySimple(formatItalic)}
        pressed={formatState.italic}
        active={formatState.italic}
      >
        <span className="editor-toolbar-glyph is-italic" aria-hidden="true">I</span>
      </ToolbarButton>

      <div className="editor-toolbar-slot">
        <ToolbarButton
          toolbarId="list"
          label={listLabel}
          className="editor-toolbar-list-trigger"
          tabStop={tabStopId === 'list'}
          onFocus={() => setTabStopId('list')}
          disabled={disabled}
          popup="menu"
          expanded={openMenu === 'list'}
          controls={listMenuId}
          active={formatState.list !== null}
          onClick={() => toggleMenu('list')}
          onKeyDown={(event) => handleTriggerKeyDown('list', event)}
        >
          <Icon name={listIcon} />
          <Icon name="chevron" className="editor-toolbar-chevron" />
        </ToolbarButton>
        {openMenu === 'list' ? (
          <div
            id={listMenuId}
            ref={menuPanelRef}
            className="editor-toolbar-popover editor-toolbar-list-menu"
            role="menu"
            aria-label={copy.listMenuLabel}
            style={menuPlacement ?? undefined}
            onKeyDown={(event) => moveMenuFocus(event, menuPanelRef.current)}
          >
            {listOptions.map((item) => (
              <button
                key={item.type}
                type="button"
                role="menuitemradio"
                aria-checked={formatState.list === item.type}
                tabIndex={-1}
                className="editor-toolbar-menu-item editor-toolbar-list-item"
                onMouseDown={keepEditorFocus}
                onClick={() => applySimple(item.command)}
              >
                <Icon name={item.icon} className="editor-toolbar-menu-icon" />
                <span>{item.label}</span>
              </button>
            ))}
            <div className="editor-toolbar-menu-divider" role="separator" />
            {listActions.map((item) => (
              <button
                key={item.labelKey}
                type="button"
                role="menuitem"
                tabIndex={-1}
                className="editor-toolbar-menu-item editor-toolbar-list-item"
                onMouseDown={keepEditorFocus}
                onClick={() => applySimple(item.command)}
              >
                <Icon name={item.icon} className="editor-toolbar-menu-icon" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="editor-toolbar-slot">
        <ToolbarButton
          toolbarId="insert"
          label={copy.insert}
          className="editor-toolbar-insert-trigger"
          tabStop={tabStopId === 'insert'}
          onFocus={() => setTabStopId('insert')}
          disabled={disabled}
          popup="menu"
          expanded={openMenu === 'insert' || openMenu === 'emoji'}
          controls={openMenu === 'emoji' ? emojiMenuId : insertMenuId}
          onClick={() => toggleMenu('insert')}
          onKeyDown={(event) => handleTriggerKeyDown('insert', event)}
        >
          <Icon name="plus" />
          <span className="editor-toolbar-insert-label">{copy.insert}</span>
          <Icon name="chevron" className="editor-toolbar-chevron" />
        </ToolbarButton>
        {openMenu === 'insert' ? (
          <div
            id={insertMenuId}
            ref={menuPanelRef}
            className="editor-toolbar-popover editor-toolbar-insert-menu"
            role="menu"
            aria-label={copy.insertMenuLabel}
            style={menuPlacement ?? undefined}
            onKeyDown={(event) => moveMenuFocus(event, menuPanelRef.current)}
          >
            {insertItems.map((item) => (
              <button
                key={item.labelKey}
                type="button"
                role="menuitem"
                tabIndex={-1}
                className="editor-toolbar-menu-item editor-toolbar-insert-item"
                onMouseDown={keepEditorFocus}
                onClick={() => applySimple(item.command)}
              >
                <Icon name={item.icon} className="editor-toolbar-menu-icon" />
                <span>{item.label}</span>
              </button>
            ))}
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              className="editor-toolbar-menu-item editor-toolbar-insert-item"
              onMouseDown={keepEditorFocus}
              onClick={() => setOpenMenu('emoji')}
            >
              <Icon name="smile" className="editor-toolbar-menu-icon" />
              <span>{copy.emoji}</span>
            </button>
          </div>
        ) : null}
        {openMenu === 'emoji' ? (
          <div
            id={emojiMenuId}
            ref={menuPanelRef}
            className="editor-toolbar-popover editor-toolbar-emoji-menu"
            role="menu"
            aria-label={copy.insertEmojiMenuLabel}
            onKeyDown={(event) => moveEmojiFocus(event, emojiGridRef.current)}
          >
            <div className="editor-toolbar-emoji-grid" ref={emojiGridRef}>
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  className="editor-toolbar-emoji"
                  aria-label={copy.insertEmojiLabel(emoji)}
                  onMouseDown={keepEditorFocus}
                  onClick={() => applyEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <NativeComponentPicker
        editorSurface={inputSurface}
        compileOptions={compileOptions}
        locale={locale}
        compact={compact}
        disabled={disabled}
        open={openMenu === 'native'}
        tabStop={tabStopId === 'components'}
        menuId={nativeMenuId}
        menuPanelRef={menuPanelRef}
        searchRef={searchRef}
        searchReset={searchReset}
        onFocus={() => setTabStopId('components')}
        onToggle={() => toggleMenu('native')}
        onTriggerKeyDown={(event) => handleTriggerKeyDown('native', event)}
        onClose={closeNativePicker}
        onInsert={commitEdit}
      />

      <div className="editor-toolbar-history" role="group" aria-label={copy.historyLabel}>
        {status ? <div className="editor-toolbar-host-status">{status}</div> : null}
        <ToolbarButton
          toolbarId="undo"
          label={copy.undo}
          tabStop={tabStopId === 'undo'}
          onFocus={() => setTabStopId('undo')}
          disabled={disabled || !canUndo}
          onClick={handleUndo}
        >
          <Icon name="undo" />
        </ToolbarButton>
        <ToolbarButton
          toolbarId="redo"
          label={copy.redo}
          tabStop={tabStopId === 'redo'}
          onFocus={() => setTabStopId('redo')}
          disabled={disabled || !canRedo}
          onClick={handleRedo}
        >
          <Icon name="redo" />
        </ToolbarButton>
        {showExport ? (
          <ToolbarButton
            toolbarId="download"
            label={copy.download}
            tabStop={tabStopId === 'download'}
            onFocus={() => setTabStopId('download')}
            disabled={disabled}
            onClick={handleExport}
          >
            <Icon name="download" />
          </ToolbarButton>
        ) : null}

        {compact?.overflow({
          menuId: moreMenuId,
          menuRef: menuPanelRef,
          open: openMenu === 'more',
          placement: menuPlacement,
          tabStop: tabStopId === 'more',
          onFocus: () => setTabStopId('more'),
          onToggle: () => toggleMenu('more'),
          onKeyDown: (event) => handleTriggerKeyDown('more', event),
          disabled,
          canUndo,
          canRedo,
          onUndo: handleUndo,
          onRedo: handleRedo,
          showExport,
          onExport: handleExport,
          status,
        })}
      </div>
    </div>
  );
}

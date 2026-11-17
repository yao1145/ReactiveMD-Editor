import type { AuthorAnalysis, AuthorCompletion } from '../contracts/authoring';
export type { AuthorAnalysis, AuthorBinding, AuthorCompletion, AuthorToken } from '../contracts/authoring';
import { AUTHORING_COPY } from '../localization/source-authoring-copy';
import { bindingAtOffset, clamp, mapOffsetAcrossSources, mapOffsetThroughEdits } from './source-selection';
/**
 * Authoring aids layered on the source editor.
 *
 * The panel reads the editor through `EditorSurface` and hands every action
 * back as an `EditorEdit`, so history, selection restoration and controlled
 * updates keep working unchanged.
 */

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import {
  completeLocalSource,
  formatLocalSource,
  renameLocalBinding,
} from 'reactive-md';
import type { LocalCompileOptions, LocalDocument, SourceRange } from 'reactive-md';
import type { EditorEdit, EditorSelection } from '../contracts/types';
import { useEditorLocale } from '../localization/locale';
import { SourcePositionIndex } from './source-positions';
import type { EditorSurface } from '../contracts/surface';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function readSelection(surface: EditorSurface): EditorSelection {
  return surface.read().selection;
}

function keepEditorFocus(event: { preventDefault(): void }): void {
  event.preventDefault();
}

function isComposingEvent(event: { isComposing?: boolean; keyCode?: number }): boolean {
  return event.isComposing === true || event.keyCode === 229;
}

/* ------------------------------------------------------------------ */
/* Authoring panel                                                     */
/* ------------------------------------------------------------------ */

export interface AuthoringPanelProps {
  source: string;
  analysis: AuthorAnalysis;
  /** Latest successful document, used for binding value types. */
  bindingDocument: LocalDocument | null;
  /** Same compile options as the preview; analysis, completion, rename and format follow them. */
  compileOptions?: LocalCompileOptions;
  editorSurface: EditorSurface;
  /** Bound large binding/reference lists; omitted renders the full list. */
  pageSize?: number;
  onEdit(edit: EditorEdit): void;
  onLocate(range: SourceRange): void;
  /** Read-only and disabled editors block every authoring action. */
  disabled?: boolean;
}

export function AuthoringPanel({
  source,
  analysis,
  bindingDocument,
  compileOptions,
  editorSurface,
  pageSize,
  onEdit,
  onLocate,
  disabled = false,
}: AuthoringPanelProps) {
  const inputSurface=editorSurface;
  const locale = useEditorLocale();
  const copy = AUTHORING_COPY[locale];
  const renameInputId = useId();
  const completionListId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const completionListRef = useRef<HTMLDivElement>(null);

  const [offset, setOffset] = useState(0);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [bindingPage, setBindingPage] = useState(0);
  const [locationPage, setLocationPage] = useState(0);
  const size = pageSize === undefined ? Infinity : Math.max(1, Math.floor(pageSize) || 50);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [completionOpen, setCompletionOpen] = useState(false);
  const [completionItems, setCompletionItems] = useState<AuthorCompletion[]>([]);
  const [completionIndex, setCompletionIndex] = useState(0);
  // Keyboard handling reads these through refs so a fast key sequence never
  // sees a stale index or a list that has already been replaced.
  const completionOpenRef = useRef(completionOpen);
  const completionItemsRef = useRef(completionItems);
  const completionIndexRef = useRef(completionIndex);
  const sourcePositions = useMemo(() => new SourcePositionIndex(source), [source]);
  completionOpenRef.current = completionOpen;
  completionItemsRef.current = completionItems;
  completionIndexRef.current = completionIndex;

  // Caret tracking is local so moving the caret never asks the host to
  // re-render the whole editor.
  useEffect(() => {
    const update = () => setOffset(inputSurface.read().selection.start);
    update();
    return inputSurface.subscribe(update);
  }, [inputSurface]);

  useEffect(() => {
    if (completionOpenRef.current) setCompletionOpen(false);
  }, [source]);

  useEffect(() => {
    setStatus(null);
    setRenameError(null);
  }, [locale]);

  const caret = useMemo(
    () => bindingAtOffset(analysis.bindings, offset),
    [analysis.bindings, offset],
  );

  useEffect(() => {
    if (caret) setSelectedName(caret.binding.name);
  }, [caret]);

  const activeBinding = useMemo(() => {
    const named = selectedName
      ? analysis.bindings.find((binding) => binding.name === selectedName)
      : undefined;
    return named ?? analysis.bindings[0] ?? null;
  }, [analysis.bindings, selectedName]);

  useEffect(() => {
    setRenameValue('');
    setRenameError(null);
  }, [activeBinding?.name]);

  const activeType = activeBinding && bindingDocument
    ? bindingDocument.bindings[activeBinding.name]?.type ?? bindingDocument.computations?.[activeBinding.name]?.type
    : undefined;
  const caretType = caret && bindingDocument
    ? bindingDocument.bindings[caret.binding.name]?.type ?? bindingDocument.computations?.[caret.binding.name]?.type
    : undefined;
  const caretTypeName = caretType ? (copy.typeNames[caretType] ?? caretType) : copy.unknownType;
  const typeName = activeType ? (copy.typeNames[activeType] ?? activeType) : copy.unknownType;

  const openCompletions = useCallback(() => {
    if (disabled) return;
    const at = clamp(inputSurface.read().selection.start, 0, source.length);
    let items: AuthorCompletion[] = [];
    try {
      items = completeLocalSource(source, at, compileOptions) ?? [];
    } catch {
      items = [];
    }
    setCompletionItems(items);
    setCompletionIndex(0);
    setCompletionOpen(true);
    setStatus(null);
  }, [compileOptions, disabled, inputSurface, source]);

  const applyCompletion = useCallback((item: AuthorCompletion) => {
    if (disabled) return;
    const start = clamp(item.range.start, 0, source.length);
    const end = clamp(item.range.end, start, source.length);
    const value = source.slice(0, start) + item.insertText + source.slice(end);
    const caretOffset = start + item.insertText.length;
    setCompletionOpen(false);
    onEdit({ value, selection: { start: caretOffset, end: caretOffset } });
  }, [disabled, onEdit, source]);

  // Completion keys are handled before the editor's editing shortcuts. They
  // are consumed only while the list is open, so Tab, IME composition and
  // normal editing keys keep their default behaviour.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isComposingEvent(event)) return;
      if (disabled) {
        if (completionOpenRef.current) setCompletionOpen(false);
        return;
      }
      const key = event.key;
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && !event.altKey && (key === ' ' || key === 'Spacebar')) {
        event.preventDefault();
        event.stopPropagation();
        openCompletions();
        return;
      }
      if (!completionOpenRef.current) return;
      if (key === 'ArrowDown' || key === 'ArrowUp') {
        event.preventDefault();
        event.stopPropagation();
        const length = completionItemsRef.current.length;
        setCompletionIndex((current) => {
          if (length === 0) return 0;
          const delta = key === 'ArrowDown' ? 1 : -1;
          return (current + delta + length) % length;
        });
        return;
      }
      if (key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        const item = completionItemsRef.current[completionIndexRef.current];
        if (item) applyCompletion(item);
        else setCompletionOpen(false);
        return;
      }
      if (key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        setCompletionOpen(false);
      }
    };
    return inputSurface.listenKeyDown(handleKeyDown);
  }, [applyCompletion, disabled, inputSurface, openCompletions]);

  useEffect(() => {
    if (!completionOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setCompletionOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isComposingEvent(event)) setCompletionOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside, true);
    document.addEventListener('keydown', closeOnEscape, true);
    return () => {
      document.removeEventListener('pointerdown', closeOutside, true);
      document.removeEventListener('keydown', closeOnEscape, true);
    };
  }, [completionOpen]);

  useEffect(() => {
    if (!completionOpen) return;
    completionListRef.current
      ?.querySelector<HTMLElement>(`[data-completion-index="${completionIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [completionIndex, completionOpen]);

  const handleFormat = () => {
    if (disabled) return;
    let formatted: string;
    try {
      formatted = formatLocalSource(source, compileOptions);
    } catch (error) {
      setStatus(copy.formatFailed(error instanceof Error ? error.message : String(error)));
      return;
    }
    if (formatted === source) {
      setStatus(copy.formatUnchanged);
      return;
    }
    const selection = readSelection(inputSurface);
    onEdit({
      value: formatted,
      selection: {
        start: mapOffsetAcrossSources(source, formatted, selection.start),
        end: mapOffsetAcrossSources(source, formatted, selection.end),
      },
    });
    setStatus(copy.formatApplied);
  };

  const handleRename = () => {
    if (disabled || !activeBinding) return;
    const nextName = renameValue.trim();
    if (!nextName) {
      setRenameError(copy.renameEmpty);
      return;
    }
    if (nextName === activeBinding.name) {
      setRenameError(copy.renameSame);
      return;
    }
    try {
      const result = renameLocalBinding(source, activeBinding.name, nextName, compileOptions);
      const selection = readSelection(inputSurface);
      onEdit({
        value: result.source,
        selection: {
          start: mapOffsetThroughEdits(selection.start, result.edits),
          end: mapOffsetThroughEdits(selection.end, result.edits),
        },
      });
      setSelectedName(nextName);
      setRenameValue('');
      setRenameError(null);
      setStatus(copy.renameDone(activeBinding.name, nextName));
    } catch (error) {
      setRenameError(copy.renameFailed(error instanceof Error ? error.message : String(error)));
    }
  };

  const activeCompletion = completionItems[completionIndex];
  const locations = activeBinding
    ? [
      ...activeBinding.declarations.map((range, index) => ({
        range,
        role: 'declaration' as const,
        index,
      })),
      ...activeBinding.references.map((range, index) => ({
        range,
        role: 'reference' as const,
        index,
      })),
    ]
    : [];
  const bindingPages = Math.max(1, Math.ceil(analysis.bindings.length / size));
  const locationPages = Math.max(1, Math.ceil(locations.length / size));
  const shownBindingPage = Math.min(bindingPage, bindingPages - 1);
  const shownLocationPage = Math.min(locationPage, locationPages - 1);
  const pager = (page: number, pages: number, change: (page: number) => void) => pages > 1 ? <div className="authoring-pagination">
    <button type="button" disabled={page === 0} onClick={() => change(page - 1)} aria-label={locale === 'zh' ? '上一页' : 'Previous page'}>←</button>
    <span aria-live="polite">{page + 1} / {pages}</span>
    <button type="button" disabled={page + 1 === pages} onClick={() => change(page + 1)} aria-label={locale === 'zh' ? '下一页' : 'Next page'}>→</button>
  </div> : null;
  const pageSlice = <T,>(items: T[], page: number): T[] => Number.isFinite(size) ? items.slice(page * size, (page + 1) * size) : items;

  return (
    <section className="source-authoring" aria-label={copy.region} ref={panelRef}>
      <div className="authoring-bar">
        <span className="authoring-title">{copy.title}</span>
        <div className="authoring-actions">
          <button
            type="button"
            className="authoring-button"
            data-authoring-action="format"
            title={copy.formatTitle}
            disabled={disabled}
            onMouseDown={keepEditorFocus}
            onClick={handleFormat}
          >
            {copy.format}
          </button>
          <button
            type="button"
            className="authoring-button"
            data-authoring-action="suggest"
            title={copy.suggestionsTitle}
            aria-expanded={completionOpen}
            aria-controls={completionListId}
            disabled={disabled}
            onMouseDown={keepEditorFocus}
            onClick={openCompletions}
          >
            {copy.suggestions}
          </button>
        </div>
      </div>

      {completionOpen ? (
        <div className="authoring-completion" aria-label={copy.completionLabel}>
          <div className="authoring-completion-head">
            <span>{copy.completionLabel}</span>
            <span className="authoring-completion-count">
              {copy.completionCount(completionItems.length)}
            </span>
          </div>
          <div
            id={completionListId}
            className="authoring-completion-list"
            role="listbox"
            aria-label={copy.completionLabel}
            ref={completionListRef}
          >
            {completionItems.length === 0 ? (
              <p className="authoring-empty">{copy.completionEmpty}</p>
            ) : completionItems.map((item, index) => (
              <button
                key={`${item.kind}-${item.range.start}-${item.range.end}-${index}`}
                type="button"
                role="option"
                data-completion-index={index}
                aria-selected={index === completionIndex}
                className={`authoring-completion-item${index === completionIndex ? ' is-active' : ''}`}
                onMouseDown={keepEditorFocus}
                onMouseEnter={() => setCompletionIndex(index)}
                onClick={() => applyCompletion(item)}
              >
                <span className={`authoring-kind is-${item.kind}`}>{copy.kinds[item.kind] ?? item.kind}</span>
                <span className="authoring-completion-label">{item.label}</span>
                {item.detail ? (
                  <span className="authoring-completion-detail">{item.detail}</span>
                ) : null}
              </button>
            ))}
          </div>
          <p className="reactive-md-editor-sr-only" aria-live="polite">
            {activeCompletion ? `${copy.kinds[activeCompletion.kind] ?? activeCompletion.kind} ${activeCompletion.label}` : ''}
          </p>
        </div>
      ) : null}

      <div className="authoring-body">
        <p className="authoring-caret" data-binding-caret={caret?.binding.name ?? ''}>
          <span className="authoring-label">{copy.caretLabel}</span>
          {caret ? (
            <span className="authoring-caret-value">
              <strong>{caret.binding.name}</strong>
              <span className="authoring-type">{copy.typeLabel}: {caretTypeName}</span>
              <span>{copy.declarationCount(caret.binding.declarations.length)}</span>
              <span>{copy.referenceCount(caret.binding.references.length)}</span>
            </span>
          ) : (
            <span className="authoring-muted">{copy.noBindingAtCaret}</span>
          )}
        </p>

        <div className="authoring-row">
          <span className="authoring-label">{copy.bindingsLabel}</span>
          <div className="authoring-binding-list">
            {analysis.bindings.length === 0 ? (
              <span className="authoring-muted">{copy.noBindings}</span>
            ) : pageSlice(analysis.bindings, shownBindingPage).map((binding) => (
              <button
                key={binding.name}
                type="button"
                data-binding-name={binding.name}
                className="authoring-binding-chip"
                aria-pressed={binding.name === activeBinding?.name}
                title={`${copy.declarationCount(binding.declarations.length)} · ${copy.referenceCount(binding.references.length)}`}
                onClick={() => {
                  setSelectedName(binding.name);
                  setLocationPage(0);
                  setStatus(null);
                }}
              >
                <span>{binding.name}</span>
                <span className="authoring-binding-count">
                  {binding.declarations.length}/{binding.references.length}
                </span>
              </button>
            ))}
          </div>
          {pager(shownBindingPage, bindingPages, setBindingPage)}
        </div>

        {activeBinding ? (
          <div className="authoring-row">
            <span className="authoring-label">
              {activeBinding.name} · {copy.typeLabel}: {typeName}
            </span>
            <div className="authoring-locations">
              {pageSlice(locations, shownLocationPage).map(({ range, role, index }) => {
                const position = sourcePositions.position(range.start);
                return (
                  <button
                    key={`${role}-${index}`}
                    type="button"
                    className={`authoring-location is-${role}`}
                    data-binding-location={role}
                    data-start={range.start}
                    data-end={range.end}
                    title={copy.locateTitle}
                    onClick={() => {
                      setSelectedName(activeBinding.name);
                      onLocate(range);
                    }}
                  >
                    <span>{role === 'declaration' ? copy.declaration : copy.reference} {index + 1}</span>
                    <span className="authoring-location-position">
                      {copy.position(position.line, position.column)}
                    </span>
                  </button>
                );
              })}
            </div>
            {pager(shownLocationPage, locationPages, setLocationPage)}
          </div>
        ) : null}

        <div className="authoring-rename">
          <label className="authoring-label" htmlFor={renameInputId}>{copy.renameLabel}</label>
          <div className="authoring-rename-row">
            <input
              id={renameInputId}
              type="text"
              className="authoring-rename-input"
              data-authoring-action="rename-input"
              value={renameValue}
              placeholder={copy.renamePlaceholder}
              autoComplete="off"
              spellCheck={false}
              disabled={disabled || !activeBinding}
              onChange={(event) => {
                setRenameValue(event.target.value);
                setRenameError(null);
              }}
              onKeyDown={(event: ReactKeyboardEvent<HTMLInputElement>) => {
                if (event.key === 'Enter' && isComposingEvent(event.nativeEvent)) {
                  event.preventDefault();
                }
              }}
            />
            <button
              type="button"
              className="authoring-button authoring-primary"
              data-authoring-action="rename"
              disabled={disabled || !activeBinding}
              onMouseDown={keepEditorFocus}
              onClick={handleRename}
              title={copy.renameTitle}
            >
              {copy.renameAction}
            </button>
          </div>
          {renameError ? (
            <p className="authoring-error" role="alert">{renameError}</p>
          ) : null}
          <p className="authoring-hint">{copy.renameHint}</p>
        </div>

        {status ? (
          <p className="authoring-status" data-authoring-status="true" role="status">{status}</p>
        ) : null}
      </div>
    </section>
  );
}

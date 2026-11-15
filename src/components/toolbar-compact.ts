import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  RefObject,
} from 'react';

/** Props the shared toolbar passes to the compact overflow menu. */
export interface CompactToolbarOverflowProps {
  menuId: string;
  /** Panel ref the toolbar keeps for Escape focus and keyboard navigation. */
  menuRef: RefObject<HTMLDivElement | null>;
  open: boolean;
  placement: CSSProperties | null;
  tabStop: boolean;
  onFocus(): void;
  onToggle(): void;
  onKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>): void;
  disabled: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo(): void;
  onRedo(): void;
  showExport: boolean;
  onExport(): void;
  status?: ReactNode;
}

/** Narrow-screen chrome the mobile layer adds to the shared toolbar.

 * The toolbar keeps state, behaviour and data. This interface carries only
 * presentation, so `editor-toolbar.tsx` imports no module from `mobile/`.
 * `codemirror/` composes the two layers and passes the object down.

 * `trackMenuPlacement` is a plain function rather than a hook: the toolbar
 * owns the effect and the state, the mobile layer supplies the measurement. */
export interface CompactToolbarChrome {
  /** Heading trigger content, including the compact label the stylesheet
   * swaps in on narrow frames. */
  headingContent(label: string, level: number): ReactNode;
  /** Components trigger content: icons and labels for both widths. */
  componentsContent(): ReactNode;
  /** History-group extras: the overflow trigger and its menu. */
  overflow(props: CompactToolbarOverflowProps): ReactNode;
  /** Keeps an open popover inside the viewport. Returns a cleanup function. */
  trackMenuPlacement(
    menu: string | null,
    trigger: HTMLElement | null,
    apply: (placement: CSSProperties | null) => void,
  ): () => void;
}

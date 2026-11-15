/** Presentation primitives shared by the toolbar and the mobile layer.

 * The toolbar and `mobile/` both render buttons and menus, so the smallest
 * reusable pieces live here rather than in either layer. Behaviour, data and
 * state stay in `editor-toolbar.tsx`. */

import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from 'react';

export type MenuEdge = 'first' | 'last';

export type IconName =
  | 'smile'
  | 'link'
  | 'bulletList'
  | 'orderedList'
  | 'taskList'
  | 'outdent'
  | 'indent'
  | 'quote'
  | 'divider'
  | 'codeBlock'
  | 'inlineCode'
  | 'strike'
  | 'image'
  | 'table'
  | 'undo'
  | 'redo'
  | 'download'
  | 'chevron'
  | 'sparkle'
  | 'search'
  | 'plus'
  | 'more'
  | 'close';

export const ICONS: Record<IconName, ReactNode> = {
  smile: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M8.6 14.1c.9 1.4 2 2.1 3.4 2.1s2.5-.7 3.4-2.1" />
      <path d="M9.2 9.7h.01M14.8 9.7h.01" />
    </>
  ),
  link: (
    <>
      <path d="M10.1 13.9a3.8 3.8 0 0 0 5.4 0l2.4-2.4a3.8 3.8 0 0 0-5.4-5.4l-1.2 1.2" />
      <path d="M13.9 10.1a3.8 3.8 0 0 0-5.4 0l-2.4 2.4a3.8 3.8 0 0 0 5.4 5.4l1.2-1.2" />
    </>
  ),
  bulletList: (
    <>
      <path d="M9.5 6.5H20M9.5 12H20M9.5 17.5H20" />
      <path d="M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" />
    </>
  ),
  orderedList: (
    <>
      <path d="M10.5 6.5H20M10.5 12H20M10.5 17.5H20" />
      <text
        x="2.9"
        y="8.6"
        fill="currentColor"
        stroke="none"
        fontSize="6.8"
        fontWeight="650"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        1
      </text>
      <text
        x="2.9"
        y="14.1"
        fill="currentColor"
        stroke="none"
        fontSize="6.8"
        fontWeight="650"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        2
      </text>
      <text
        x="2.9"
        y="19.6"
        fill="currentColor"
        stroke="none"
        fontSize="6.8"
        fontWeight="650"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        3
      </text>
    </>
  ),
  taskList: (
    <>
      <rect x="3" y="4" width="5.6" height="5.6" rx="1.2" />
      <path d="M4.5 6.8l1 1 1.6-1.9" />
      <path d="M12 6.8h8.4" />
      <path d="M3.4 13.9h5M3.4 17.4h5" opacity=".55" />
      <path d="M12 13.9h8.4M12 17.4h8.4" opacity=".55" />
    </>
  ),
  outdent: (
    <>
      <path d="M10 6.5H20M10 12H20M10 17.5H20" />
      <path d="M7.2 9l-3.4 3 3.4 3M4.2 12h7" />
    </>
  ),
  indent: (
    <>
      <path d="M10 6.5H20M10 12H20M10 17.5H20" />
      <path d="M3.8 9l3.4 3-3.4 3M3.2 12h7" />
    </>
  ),
  quote: (
    <>
      <path d="M10 8.2c-2.4.7-3.8 2.4-3.8 5.2V17H10v-4.2H7.5c0-1.5.7-2.6 2.5-3.2z" />
      <path d="M18.5 8.2c-2.4.7-3.8 2.4-3.8 5.2V17h3.8v-4.2h-2.5c0-1.5.7-2.6 2.5-3.2z" />
    </>
  ),
  divider: (
    <>
      <path d="M4 12h16" />
      <path d="M7 7.5h10M7 16.5h10" opacity=".55" />
    </>
  ),
  codeBlock: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2.4" />
      <path d="M9.8 9.3l-2.7 2.7 2.7 2.7M14.2 9.3l2.7 2.7-2.7 2.7" />
    </>
  ),
  inlineCode: (
    <>
      <path d="M8.8 8.5L5 12l3.8 3.5M15.2 8.5L19 12l-3.8 3.5" />
      <path d="M13.6 6.5l-3.2 11" opacity=".45" />
    </>
  ),
  strike: (
    <>
      <path d="M4 12h16" />
      <path d="M16.7 7.4c-.7-1.2-2-1.9-3.7-1.9-2.3 0-3.9 1.1-3.9 2.8 0 1.5 1.1 2.3 3.7 3 2.8.8 4.2 1.7 4.2 3.5 0 2-1.7 3.2-4.3 3.2-2.1 0-3.6-.8-4.3-2.2" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2.4" />
      <circle cx="8.4" cy="9.4" r="1.35" />
      <path d="M4.6 17.4l4.9-4.9 3.5 3.5 2.7-2.7 3.7 3.7" />
    </>
  ),
  table: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2.4" />
      <path d="M3.4 9.7h17.2M9.7 9.2v10.2M14.9 9.2v10.2M9.2 14.5h11.4" />
    </>
  ),
  undo: (
    <>
      <path d="M5 12h9.2a4.3 4.3 0 0 1 0 8.6h-1.8" />
      <path d="M8.8 8.2L5 12l3.8 3.8" />
    </>
  ),
  redo: (
    <>
      <path d="M19 12h-9.2a4.3 4.3 0 0 0 0 8.6h1.8" />
      <path d="M15.2 8.2L19 12l-3.8 3.8" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v10.5M8 10.8l4 3.7 4-3.7" />
      <path d="M4.5 17.5v2h15v-2" />
    </>
  ),
  chevron: <path d="M7.5 9.7l4.5 4.5 4.5-4.5" />,
  sparkle: (
    <>
      <path d="M11.2 4.2l1.5 4.3 4.3 1.5-4.3 1.5-1.5 4.3-1.5-4.3-4.3-1.5 4.3-1.5z" />
      <path d="M18.3 15.4v3.4M16.6 17.1h3.4" />
    </>
  ),
  search: (
    <>
      <circle cx="10.6" cy="10.6" r="5.6" />
      <path d="M14.8 14.8L20 20" />
    </>
  ),
  plus: <path d="M12 5.2v13.6M5.2 12h13.6" />,
  more: (
    <>
      <circle cx="5.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
};

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className ? `editor-toolbar-icon ${className}` : 'editor-toolbar-icon'}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name]}
    </svg>
  );
}

export function keepEditorFocus(event: ReactMouseEvent<HTMLButtonElement>): void {
  event.preventDefault();
}

export interface ToolbarButtonProps {
  toolbarId: string;
  label: string;
  tabStop: boolean;
  onFocus(): void;
  onClick(): void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  expanded?: boolean;
  popup?: 'menu' | 'dialog';
  controls?: string;
  pressed?: boolean;
  active?: boolean;
  onKeyDown?(event: ReactKeyboardEvent<HTMLButtonElement>): void;
}

export function ToolbarButton({
  toolbarId,
  label,
  tabStop,
  onFocus,
  onClick,
  children,
  className,
  disabled,
  expanded,
  popup,
  controls,
  pressed,
  active,
  onKeyDown,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      data-toolbar-item="true"
      data-toolbar-id={toolbarId}
      data-tooltip={label}
      className={
        `editor-toolbar-button${className ? ` ${className}` : ''}` +
        (active ? ' is-active' : '')
      }
      aria-label={label}
      aria-pressed={pressed}
      aria-expanded={expanded}
      aria-haspopup={popup}
      aria-controls={controls}
      disabled={disabled}
      tabIndex={tabStop ? 0 : -1}
      onFocus={onFocus}
      onMouseDown={popup ? undefined : keepEditorFocus}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      {children}
    </button>
  );
}

export function getMenuItems(container: HTMLElement | null): HTMLButtonElement[] {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll<HTMLButtonElement>(
      '[role="menuitem"], [role="menuitemradio"]',
    ),
  ).filter((item) => !item.disabled && item.getClientRects().length > 0);
}

export function moveMenuFocus(
  event: ReactKeyboardEvent<HTMLElement>,
  container: HTMLElement | null,
): void {
  const items = getMenuItems(container);
  if (items.length === 0) return;
  const active = document.activeElement as HTMLButtonElement | null;
  const index = active ? items.indexOf(active) : -1;
  let next = index;

  switch (event.key) {
    case 'ArrowDown':
      next = index < 0 ? 0 : (index + 1) % items.length;
      break;
    case 'ArrowUp':
      next = index < 0 ? items.length - 1 : (index - 1 + items.length) % items.length;
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
  items[next]?.focus();
}

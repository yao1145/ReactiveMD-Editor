import type {RefObject} from 'react';
import type {EditorViewMode} from '../contracts/types';
import {useNarrowEditor} from './use-narrow-editor';

/** Resolves the requested view mode against the frame width.

 * Narrow frames cannot show a two-column split, so the view falls back to edit
 * and the split option withdraws. */
export function useCompactView(
  frame: RefObject<HTMLElement|null>,
  requested: EditorViewMode,
): {view: EditorViewMode; allowSplit: boolean} {
  const narrow=useNarrowEditor(frame);
  return {view:narrow&&requested==='split'?'edit':requested,allowSplit:!narrow};
}

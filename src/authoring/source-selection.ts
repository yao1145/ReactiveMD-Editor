import type { SourceRange } from 'reactive-md';
import type { AuthorBinding } from '../contracts/authoring';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function contains(range: SourceRange, offset: number): boolean {
  return offset >= range.start && offset <= range.end;
}

function rangeSize(range: SourceRange): number {
  return range.end - range.start;
}

interface CaretBinding {
  binding: AuthorBinding;
  role: 'declaration' | 'reference';
}

export function bindingAtOffset(bindings: AuthorBinding[], offset: number): CaretBinding | null {
  let best: CaretBinding | null = null;
  let bestSize = Number.POSITIVE_INFINITY;
  const consider = (binding: AuthorBinding, range: SourceRange, role: CaretBinding['role']) => {
    if (!contains(range, offset)) return;
    const size = rangeSize(range);
    if (size >= bestSize) return;
    best = { binding, role };
    bestSize = size;
  };
  for (const binding of bindings) {
    for (const range of binding.declarations) consider(binding, range, 'declaration');
    for (const range of binding.references) consider(binding, range, 'reference');
  }
  return best;
}

function commonPrefixLength(a: string, b: string): number {
  const limit = Math.min(a.length, b.length);
  let index = 0;
  while (index < limit && a[index] === b[index]) index += 1;
  return index;
}

function commonSuffixLength(a: string, b: string, prefix: number): number {
  const limit = Math.min(a.length, b.length) - prefix;
  let index = 0;
  while (index < limit && a[a.length - 1 - index] === b[b.length - 1 - index]) index += 1;
  return index;
}

/** Maps a caret through a conservative source rewrite (formatting). */
export function mapOffsetAcrossSources(before: string, after: string, offset: number): number {
  const clamped = clamp(offset, 0, before.length);
  const prefix = commonPrefixLength(before, after);
  if (clamped <= prefix) return clamped;
  const suffix = commonSuffixLength(before, after, prefix);
  const oldSuffixStart = before.length - suffix;
  if (clamped >= oldSuffixStart) return after.length - suffix + (clamped - oldSuffixStart);
  const oldMiddleLength = oldSuffixStart - prefix;
  const newMiddleLength = after.length - suffix - prefix;
  if (oldMiddleLength <= 0) return after.length - suffix;
  const ratio = (clamped - prefix) / oldMiddleLength;
  return Math.round(prefix + ratio * newMiddleLength);
}

/** Maps a caret through the exact token replacements returned by rename. */
export function mapOffsetThroughEdits(
  offset: number,
  edits: readonly { range: SourceRange; text: string }[],
): number {
  let delta = 0;
  for (const edit of [...edits].sort((a, b) => a.range.start - b.range.start)) {
    if (offset < edit.range.start) break;
    if (offset > edit.range.end) {
      delta += edit.text.length - rangeSize(edit.range);
      continue;
    }
    return edit.range.start + delta + Math.min(offset - edit.range.start, edit.text.length);
  }
  return offset + delta;
}

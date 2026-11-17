import { describe, expect, it } from 'vitest';
import { bindingAtOffset, mapOffsetAcrossSources, mapOffsetThroughEdits } from '../src/authoring/source-selection';

describe('authoring selection projections', () => {
  it('selects the narrowest binding range and preserves declaration priority for ties', () => {
    const broad = { name: 'broad', declarations: [{ start: 0, end: 12 }], references: [] };
    const narrow = { name: 'narrow', declarations: [{ start: 3, end: 6 }], references: [{ start: 3, end: 6 }] };
    expect(bindingAtOffset([broad, narrow], 4)).toEqual({ binding: narrow, role: 'declaration' });
    expect(bindingAtOffset([broad, narrow], 6)?.binding.name).toBe('narrow');
    expect(bindingAtOffset([broad, narrow], 13)).toBeNull();
  });

  it('keeps the prefix and suffix selected when formatting changes the middle', () => {
    expect(mapOffsetAcrossSources('abcXdef', 'abcLONGdef', 2)).toBe(2);
    expect(mapOffsetAcrossSources('abcXdef', 'abcLONGdef', 5)).toBe(8);
    expect(mapOffsetAcrossSources('abcXdef', 'abcLONGdef', 100)).toBe(10);
    expect(mapOffsetAcrossSources('abcXdef', 'abcLONGdef', -1)).toBe(0);
    expect(mapOffsetAcrossSources('same', 'same', 2)).toBe(2);
  });

  it('maps carets through sorted rename replacements without mutating their order', () => {
    const edits = [{ range: { start: 8, end: 11 }, text: 'n' }, { range: { start: 0, end: 3 }, text: 'name' }];
    expect(mapOffsetThroughEdits(5, edits)).toBe(6);
    expect(mapOffsetThroughEdits(9, edits)).toBe(10);
    expect(mapOffsetThroughEdits(12, edits)).toBe(11);
    expect(edits[0].range.start).toBe(8);
  });
});

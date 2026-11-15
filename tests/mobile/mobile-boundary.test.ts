import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const src = join(root, 'src');

function source(path: string): string {
  return readFileSync(join(root, path), 'utf8');
}

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(path));
    else files.push(path);
  }
  return files;
}

const show = (path: string) => relative(root, path).replace(/\\/g, '/');

describe('mobile layer boundary', () => {
  it('keeps shared layers free of imports from src/mobile', () => {
    // `editor-toolbar.tsx` receives mobile presentation through
    // `CompactToolbarChrome`; `codemirror/` is the only composer.
    const importPatterns = [
      /\bfrom\s+['"](?:\.\.\/)+mobile\//,
      /\bfrom\s+['"]\.\/mobile\//,
    ];
    const offenders: string[] = [];
    for (const dir of ['components', 'contracts', 'localization']) {
      for (const file of walk(join(src, dir))) {
        if (!/\.(?:ts|tsx)$/.test(file)) continue;
        const text = readFileSync(file, 'utf8');
        if (importPatterns.some((pattern) => pattern.test(text))) offenders.push(show(file));
      }
    }
    expect(offenders).toEqual([]);
  });

  it('keeps the public contract mobile-free', () => {
    const contract = source('src/contracts/types.ts');
    expect(contract).not.toContain('mobileBar');
    expect(contract).not.toContain('MobileDocBar');
  });

  it('keeps compact copy out of the shared locale table', () => {
    const i18n = source('src/localization/editor-i18n.ts');
    expect(i18n).not.toContain('componentsCompactLabel');
    expect(i18n).not.toContain('moreMenuLabel');
    expect(i18n).not.toContain('more:');
  });

  it('defines compact copy for both locales', () => {
    const copy = source('src/mobile/compact-toolbar-copy.ts');
    expect(copy).toContain('en:');
    expect(copy).toContain('zh:');
    for (const key of ['more', 'moreMenuLabel', 'componentsCompactLabel']) {
      expect(copy).toContain(`${key}:`);
    }
  });

  it('reads breakpoints from a single module', () => {
    const breakpoints = source('src/mobile/breakpoints.ts');
    // One primary threshold for the frame and the viewport, one tiny density
    // tier. No second width may creep back in.
    expect(breakpoints).toMatch(/NARROW_FRAME_WIDTH\s*=\s*760/);
    expect(breakpoints).toMatch(/NARROW_VIEWPORT_QUERY\s*=\s*['"]\(max-width: 760px\)['"]/);
    expect(breakpoints).toMatch(/TINY_SCREEN_WIDTH\s*=\s*400/);

    const narrow = source('src/mobile/use-narrow-editor.ts');
    expect(narrow).toContain('NARROW_FRAME_WIDTH');
    expect(narrow).not.toContain('760');

    const placement = source('src/mobile/use-compact-menu-placement.ts');
    expect(placement).toContain('NARROW_VIEWPORT_QUERY');
    expect(placement).not.toContain('760px');
  });

  it('has no viewport literal outside breakpoints.ts', () => {
    const offenders = walk(src)
      .filter((path) => /\.(?:ts|tsx)$/.test(path))
      .filter((path) => !path.endsWith('breakpoints.ts'))
      .filter((path) => /max-width:\s*(?:5|6|7)\d\d/.test(readFileSync(path, 'utf8')))
      .map(show);
    expect(offenders).toEqual([]);
  });

  it('keeps stylesheet thresholds to the shared numbers', () => {
    // CSS cannot import breakpoints.ts, so guard the query conditions instead
    // of every declaration (width caps such as `max-width: 380px` are sizes).
    const allowed = new Set(['760px', '400px']);
    const offenders: string[] = [];
    for (const file of walk(join(src, 'mobile')).filter((path) => path.endsWith('.css'))) {
      for (const line of readFileSync(file, 'utf8').split('\n')) {
        if (!/^\s*@(?:media|container)\b/.test(line)) continue;
        for (const [, value] of line.matchAll(/max-width:\s*(\d+px)/g)) {
          if (!allowed.has(value)) offenders.push(`${show(file)}: ${value}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

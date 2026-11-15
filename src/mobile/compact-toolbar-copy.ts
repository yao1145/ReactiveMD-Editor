/** Copy used only by the compact toolbar.

 * These strings never reach the desktop toolbar, so they live with the mobile
 * layer instead of the shared `localization/editor-i18n.ts` table. */
import type {EditorLocale} from '../contracts/types';

export interface CompactToolbarCopy {
  more: string;
  moreMenuLabel: string;
  componentsCompactLabel: string;
}

export const COMPACT_TOOLBAR_COPY:Record<EditorLocale,CompactToolbarCopy>={
  en:{
    more:'More',
    moreMenuLabel:'More actions',
    componentsCompactLabel:'Component',
  },
  zh:{
    more:'更多',
    moreMenuLabel:'更多操作',
    componentsCompactLabel:'组件',
  },
};

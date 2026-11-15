import type {CSSProperties} from 'react';
import {NARROW_VIEWPORT_QUERY} from './breakpoints';

const COMPACT_MENU_WIDTHS: Record<string,number>={heading:200,list:208,insert:216,more:188};

/** Keeps an open toolbar menu inside the viewport while the layout is
 * narrow. The clamp applies while `NARROW_VIEWPORT_QUERY` matches, the
 * viewport counterpart of the frame threshold. Beyond that width the CSS
 * position is authoritative.
 *
 * The caller owns the menu state and the trigger element; this function only
 * measures and writes the placement. When the viewport is not narrow it
 * applies `null` so the stylesheet position wins. Returns a cleanup that
 * detaches the media, resize and scroll listeners. */
export function trackCompactMenuPlacement(
  menu: string|null,
  trigger: HTMLElement|null,
  apply: (placement: CSSProperties|null)=>void,
): ()=>void {
  if(!menu){apply(null);return()=>{};}
  const media=window.matchMedia(NARROW_VIEWPORT_QUERY);
  const update=()=>{
    if(!media.matches){apply(null);return;}
    if(!trigger)return;
    const rect=trigger.getBoundingClientRect();
    const width=COMPACT_MENU_WIDTHS[menu]??216;
    const gutter=8,gap=6;
    const spaceAbove=rect.top-gap-gutter;
    const spaceBelow=window.innerHeight-rect.bottom-gap-gutter;
    const style: CSSProperties={};
    if(spaceAbove>=spaceBelow){
      style.bottom=window.innerHeight-rect.top+gap;
      style.top='auto';
      style.maxHeight=Math.max(80,spaceAbove);
    }else{
      style.top=rect.bottom+gap;
      style.bottom='auto';
      style.maxHeight=Math.max(80,spaceBelow);
    }
    if(menu==='heading'||menu==='list'){
      style.left=Math.min(Math.max(gutter,rect.left),window.innerWidth-gutter-width);
      style.right='auto';
    }else{
      style.right=Math.min(Math.max(gutter,window.innerWidth-rect.right),window.innerWidth-gutter-width);
      style.left='auto';
    }
    apply(style);
  };
  update();
  media.addEventListener('change',update);
  window.addEventListener('resize',update);
  window.addEventListener('scroll',update,true);
  return()=>{
    media.removeEventListener('change',update);
    window.removeEventListener('resize',update);
    window.removeEventListener('scroll',update,true);
  };
}

import {useLayoutEffect,type CSSProperties} from 'react';

const COMPACT_MENU_WIDTHS: Record<string,number>={heading:200,list:208,insert:216,more:188};

/** Keeps an open toolbar menu inside the viewport while the frame is
 * phone-sized. Beyond that width the CSS position is authoritative. */
export function useCompactMenuPlacement({menu,enabled,getTrigger,setPlacement}:{
  menu: string|null;
  enabled: boolean;
  getTrigger(menu: string): HTMLElement|null;
  setPlacement(placement: CSSProperties|null): void;
}) {
  useLayoutEffect(()=>{
    if(!enabled||!menu){setPlacement(null);return;}
    const media=window.matchMedia('(max-width: 640px)');
    const update=()=>{
      if(!media.matches){setPlacement(null);return;}
      const trigger=getTrigger(menu);
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
      setPlacement(style);
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
  },[menu,enabled,getTrigger,setPlacement]);
}

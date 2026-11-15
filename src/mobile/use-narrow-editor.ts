import {useLayoutEffect,useState,type RefObject} from 'react';
import {NARROW_FRAME_WIDTH} from './breakpoints';

/** Tracks whether the editor frame is too narrow for split view.

 * The threshold defaults to `NARROW_FRAME_WIDTH`, the same width the mobile
 * container queries apply to the frame: a frame at or under it is narrow.
 * The measurement follows the frame, not the viewport, so a narrow pane on a
 * wide page gets the same compact behaviour as a phone. */
export function useNarrowEditor(frame: RefObject<HTMLElement|null>, threshold=NARROW_FRAME_WIDTH): boolean {
  const [narrow,setNarrow]=useState(false);
  useLayoutEffect(()=>{
    const element=frame.current;
    if(!element)return;
    const measure=()=>setNarrow(element.clientWidth<=threshold);
    measure();
    if(typeof ResizeObserver==='undefined'){
      window.addEventListener('resize',measure);
      return()=>window.removeEventListener('resize',measure);
    }
    const observer=new ResizeObserver(measure);
    observer.observe(element);
    return()=>observer.disconnect();
  },[frame,threshold]);
  return narrow;
}

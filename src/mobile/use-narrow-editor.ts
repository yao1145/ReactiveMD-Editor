import {useLayoutEffect,useState,type RefObject} from 'react';

/** Tracks whether the editor frame is too narrow for split view.

 * The measurement follows the frame, not the viewport, so a narrow pane on a
 * wide page gets the same compact behaviour as a phone. */
export function useNarrowEditor(frame: RefObject<HTMLElement|null>, threshold=600): boolean {
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

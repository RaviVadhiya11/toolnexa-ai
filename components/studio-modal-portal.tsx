'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';

/**
 * Render all subscription and limit dialogs directly under <body>.
 * A Studio panel can have transforms, clipping or isolated stacking contexts;
 * a fixed dialog nested inside that panel is not reliably viewport-fixed.
 */
export function StudioModalPortal({
 open,onClose,children
}:{open:boolean;onClose:()=>void;children:ReactNode}){
 const [mounted,setMounted]=useState(false);
 const overlay=useRef<HTMLDivElement|null>(null);
 const onCloseRef=useRef(onClose);
 onCloseRef.current=onClose;

 useEffect(()=>{setMounted(true)},[]);
 useEffect(()=>{
  if(!mounted||!open)return;
  const oldFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const before=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const frame=requestAnimationFrame(()=>{
   const first=overlay.current?.querySelector<HTMLElement>('[data-modal-close]');
   first?.focus({preventScroll:true});
  });
  const key=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();onCloseRef.current();return}
   if(event.key!=='Tab')return;
   const nodes=[...(overlay.current?.querySelectorAll<HTMLElement>(
    'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])'
   )??[])].filter(node=>node.getClientRects().length>0);
   if(!nodes.length)return;
   const first=nodes[0],last=nodes[nodes.length-1];
   if(event.shiftKey&&(document.activeElement===first||!overlay.current?.contains(document.activeElement))){
    event.preventDefault();last.focus();
   }else if(!event.shiftKey&&(document.activeElement===last||!overlay.current?.contains(document.activeElement))){
    event.preventDefault();first.focus();
   }
  };
  document.addEventListener('keydown',key);
  return()=>{
   cancelAnimationFrame(frame);
   document.removeEventListener('keydown',key);
   document.body.style.overflow=before;
   if(oldFocus?.isConnected)oldFocus.focus({preventScroll:true});
  };
 },[mounted,open]);

 if(!mounted||!open)return null;
 return createPortal(
  <div ref={overlay} className="studio-paywall-overlay studio-premium-paywall" role="presentation"
   onMouseDown={e=>{if(e.target===e.currentTarget)onCloseRef.current()}}>
   {children}
  </div>,document.body
 );
}

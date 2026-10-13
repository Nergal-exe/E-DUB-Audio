import { useEffect, useState, type InputHTMLAttributes } from 'react';
// Taslak metni yerel tutar: "-", "0." veya geçici olarak aralık dışı değerler yazılabilir; değer geçerliyse anında, değilse odak kaybında sınırlanarak uygulanır.
type Props=Omit<InputHTMLAttributes<HTMLInputElement>,'value'|'onChange'|'min'|'max'|'type'>&{value:number;min:number;max:number;onCommit:(value:number)=>void};
export function NumberField({value,min,max,onCommit,onBlur,onKeyDown,...rest}:Props){
 const [draft,setDraft]=useState(String(value));
 useEffect(()=>{setDraft(d=>Number(d.replace(',','.'))===value?d:String(value));},[value]);
 const parse=(text:string)=>{const n=Number(text.trim().replace(',','.'));return text.trim()!==''&&Number.isFinite(n)?n:null;};
 const commit=()=>{const n=parse(draft);if(n===null){setDraft(String(value));return;}const v=Math.max(min,Math.min(max,n));setDraft(String(v));if(v!==value)onCommit(v);};
 return <input {...rest} type="text" inputMode="decimal" value={draft} aria-valuemin={min} aria-valuemax={max}
  onChange={e=>{setDraft(e.target.value);const n=parse(e.target.value);if(n!==null&&n>=min&&n<=max)onCommit(n);}}
  onBlur={e=>{commit();onBlur?.(e);}}
  onKeyDown={e=>{if(e.key==='Enter')commit();else if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();const step=Number(rest.step)||1;const v=Math.max(min,Math.min(max,+((parse(draft)??value)+(e.key==='ArrowUp'?step:-step)).toFixed(4)));setDraft(String(v));onCommit(v);}onKeyDown?.(e);}}/>;
}

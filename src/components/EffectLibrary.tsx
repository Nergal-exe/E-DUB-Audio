import { useState } from 'react';
import { Search, Check, ChevronRight } from 'lucide-react';
import { categories, effects, type EffectState } from '../effects';
import { Button } from './ui/button';
export function EffectLibrary({state,onSelect}:{state:Record<string,EffectState>;onSelect:(id:string)=>void}){
 const [query,setQuery]=useState('');const [category,setCategory]=useState('Tümü');
 const filtered=effects.filter(e=>(category==='Tümü'||e.category===category)&&`${e.name} ${e.description}`.toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr')));
 return <div className="effect-library"><div className="library-search"><Search size={17}/><input aria-label="Efekt ara" placeholder="Efekt adı veya kullanım amacı ara…" value={query} onChange={e=>setQuery(e.target.value)}/><span>{effects.length} efekt</span></div><div className="library-categories">{['Tümü',...categories].map(c=><button key={c} className={category===c?'active':''} onClick={()=>setCategory(c)}>{c}</button>)}</div><div className="library-results">{filtered.length?filtered.map(e=><article className="library-effect" key={e.id}><div><small>{e.category}</small><h3>{e.name}{['deep','rnnoise'].includes(e.id)&&<span className="model-badge">Yerel AI</span>}{e.id==='autotune'&&<span className="model-badge">Deneysel</span>}</h3><p>{e.description}</p></div><Button variant={state[e.id].enabled?'ghost':'outline'} size="sm" onClick={()=>onSelect(e.id)} aria-label={`${e.name} ${state[e.id].enabled?'düzenle':'ekle'}`}>{state[e.id].enabled?<Check size={15}/>:<ChevronRight size={15}/>} {state[e.id].enabled?'Düzenle':'Ekle'}</Button></article>):<p className="empty-results">Bu aramayla eşleşen efekt bulunamadı.</p>}</div></div>;
}

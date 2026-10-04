export const audioColors=['#a32bff','#04cfff','#00ef77','#ffe448','#ff3671'];
const positions=[0,.25,.5,.7,1];
export function audioColor(position:number){const t=Math.max(0,Math.min(1,position));const i=Math.min(3,Math.max(0,positions.findIndex((p,j)=>j<4&&t>=p&&t<=positions[j+1])));const mix=(t-positions[i])/(positions[i+1]-positions[i]);const a=audioColors[i],b=audioColors[i+1];return `rgb(${[1,3,5].map(k=>Math.round(parseInt(a.slice(k,k+2),16)*(1-mix)+parseInt(b.slice(k,k+2),16)*mix)).join(',')})`;}

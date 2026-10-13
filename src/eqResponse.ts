// Web Audio BiquadFilterNode formülleriyle (Audio EQ Cookbook) 10 bandın birleşik genlik yanıtı.
// Raf filtrelerinde Web Audio Q kullanmaz; eğim S=1 sabittir.
const SAMPLE_RATE=48000;
type Band={type:BiquadFilterType;frequency:number;q:number;gain:number};
function coefficients({type,frequency,q,gain}:Band){
 const A=Math.pow(10,gain/40),w0=2*Math.PI*Math.min(frequency,SAMPLE_RATE/2-1)/SAMPLE_RATE,cos=Math.cos(w0),sin=Math.sin(w0);
 if(type==='peaking'){const alpha=sin/(2*q);return [1+alpha*A,-2*cos,1-alpha*A,1+alpha/A,-2*cos,1-alpha/A];}
 const alpha=sin/2*Math.SQRT2,k=2*Math.sqrt(A)*alpha;
 if(type==='lowshelf')return [A*((A+1)-(A-1)*cos+k),2*A*((A-1)-(A+1)*cos),A*((A+1)-(A-1)*cos-k),(A+1)+(A-1)*cos+k,-2*((A-1)+(A+1)*cos),(A+1)+(A-1)*cos-k];
 return [A*((A+1)+(A-1)*cos+k),-2*A*((A-1)+(A+1)*cos),A*((A+1)+(A-1)*cos-k),(A+1)-(A-1)*cos+k,2*((A-1)-(A+1)*cos),(A+1)-(A-1)*cos-k];
}
function magnitudeDb([b0,b1,b2,a0,a1,a2]:number[],f:number){
 const w=2*Math.PI*f/SAMPLE_RATE,c1=Math.cos(w),s1=Math.sin(w),c2=Math.cos(2*w),s2=Math.sin(2*w);
 const nr=b0+b1*c1+b2*c2,ni=-(b1*s1+b2*s2),dr=a0+a1*c1+a2*c2,di=-(a1*s1+a2*s2);
 return 10*Math.log10((nr*nr+ni*ni)/(dr*dr+di*di));
}
export const EQ_MIN=20,EQ_MAX=20000;
export const frequencyToX=(f:number)=>Math.log(f/EQ_MIN)/Math.log(EQ_MAX/EQ_MIN);
export function eqResponse(s:{gains:number[];frequencies:number[];qs:number[];types:BiquadFilterType[];preamp:number},points=160){
 const filters=s.gains.map((gain,i)=>coefficients({type:s.types[i],frequency:s.frequencies[i],q:s.qs[i],gain}));
 return Array.from({length:points},(_,i)=>{const f=EQ_MIN*Math.pow(EQ_MAX/EQ_MIN,i/(points-1));return {f,db:s.preamp+filters.reduce((sum,c)=>sum+magnitudeDb(c,f),0)};});
}

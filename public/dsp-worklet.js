/* Original E-DUB DSP. Stereo-linked dynamics, persistent state, bounded output. */
const db=v=>20*Math.log10(Math.max(1e-9,v));
const gain=v=>Math.pow(10,v/20);
class EdubDSP extends AudioWorkletProcessor {
 constructor(options){super();this.kind=options.processorOptions.kind;this.p=options.processorOptions.values||{};this.env=0;this.g=1;this.low=[0,0];this.high=[0,0];this.bandEnv=[0,0,0];this.bandGain=[1,1,1];this.held=[0,0];this.tick=0;this.ring=[new Float32Array(32768),new Float32Array(32768)];this.pos=0;this.phase=0;this.pitchRatio=1;this.window=Math.round(sampleRate*.05);this.look=Math.round(sampleRate*.005);this.peak=0;this.lp=[0,0];this.prevHigh=[0,0];this.noiseStates=Array.from({length:2},()=>new Float64Array(32));this.noiseEnv=new Float64Array(32);this.noiseGain=new Float64Array(32).fill(1);this.noiseA=Float64Array.from({length:32},(_,b)=>1-Math.exp(-2*Math.PI*(40*Math.pow(500,b/31))/sampleRate));this.bands=[new Float64Array(3),new Float64Array(3)];this.pair=new Float64Array(2);this.highPair=new Float64Array(2);this.port.onmessage=e=>{if(e.data.type==='dispose')this.disposed=true;else this.p=e.data;};}
 process(inputs,outputs){if(this.disposed)return false;const input=inputs[0],out=outputs[0];if(!out?.length)return true;const p=this.p;const ch=input.length;const coefficient=(ms)=>Math.exp(-1/(sampleRate*ms*.001));const attack=coefficient(3),release=coefficient(p.release||100);const lowA=1-Math.exp(-2*Math.PI*250/sampleRate),highA=1-Math.exp(-2*Math.PI*2500/sampleRate);const gate=(env,t,range)=>db(env)>t?1:gain(range);const read=(c,delay)=>{const at=(this.pos-delay+32768)%32768;const i=Math.floor(at),f=at-i;return this.ring[c][i]*(1-f)+this.ring[c][(i+1)%32768]*f;};
 for(let i=0;i<out[0].length;i++){
  let l=input[0]?.[i]||0,r=input[ch>1?1:0]?.[i]||0;const peak=Math.max(Math.abs(l),Math.abs(r));this.env=(peak>this.env?attack:release)*this.env+(1-(peak>this.env?attack:release))*peak;
  switch(this.kind){
   case 'gate':case 'expander':case 'autogain':{
    let target=1;if(this.kind==='gate')target=gate(this.env,p.threshold,p.range);
    if(this.kind==='expander')target=gain(Math.max(-80,Math.min(0,(db(this.env)-p.threshold)*(p.ratio-1))));
    if(this.kind==='autogain'){this.rms=(this.rms||0)*.9995+(l*l+r*r)*.00025;target=this.rms>1e-7?Math.min(gain(p.max),gain(p.target)/Math.sqrt(this.rms)):1;}
    const a=this.kind==='autogain'?.99998:target<this.g?attack:release;this.g=a*this.g+(1-a)*target;l*=this.g;r*=this.g;break;
   }
   case 'limiter':case 'maximizer':{
    const drive=gain(p.drive||0),ceiling=gain(p.ceiling);l*=drive;r*=drive;const prev=(this.pos-this.look+32768)%32768;
    const dl=this.ring[0][prev],dr=this.ring[1][prev];this.ring[0][this.pos]=l;this.ring[1][this.pos]=r;
    // Peak envelope includes the delayed sample and the entire lookahead interval.
    if(Math.max(Math.abs(dl),Math.abs(dr))>=this.peak){this.peak=0;for(let k=0;k<=this.look;k++){const a=(this.pos-k+32768)%32768;this.peak=Math.max(this.peak,Math.abs(this.ring[0][a]),Math.abs(this.ring[1][a]));}}
    this.peak=Math.max(this.peak,Math.abs(l),Math.abs(r));const target=Math.min(1,ceiling/Math.max(1e-9,this.peak));this.g=target<this.g?target:release*this.g+(1-release)*target;l=dl*this.g;r=dr*this.g;break;
   }
   case 'multicomp':case 'multigate':{
    const bands=this.bands;for(let c=0;c<2;c++){const v=c?r:l;this.low[c]+=lowA*(v-this.low[c]);this.high[c]+=highA*(v-this.high[c]);bands[c][0]=this.low[c];bands[c][1]=this.high[c]-this.low[c];bands[c][2]=v-this.high[c];}l=0;r=0;
    for(let b=0;b<3;b++){const v=Math.max(Math.abs(bands[0][b]),Math.abs(bands[1][b]));const a=v>this.bandEnv[b]?attack:release;this.bandEnv[b]=a*this.bandEnv[b]+(1-a)*v;const t=[p.low,p.mid,p.high][b];const target=this.kind==='multigate'?gate(this.bandEnv[b],t,p.range):gain(Math.min(0,(t-db(this.bandEnv[b]))*(1-1/p.ratio)));this.bandGain[b]=.98*this.bandGain[b]+.02*target;l+=bands[0][b]*this.bandGain[b];r+=bands[1][b]*this.bandGain[b];}break;
   }
   case 'noise':{
    const v=this.pair;v[0]=l;v[1]=r;let resultL=0,resultR=0;for(let b=0;b<32;b++){const a=this.noiseA[b];const band=this.highPair;for(let c=0;c<2;c++){this.noiseStates[c][b]+=a*(v[c]-this.noiseStates[c][b]);band[c]=b===31?v[c]-(b?this.noiseStates[c][b-1]:0):this.noiseStates[c][b]-(b?this.noiseStates[c][b-1]:0);}const level=Math.max(Math.abs(band[0]),Math.abs(band[1]));this.noiseEnv[b]=.995*this.noiseEnv[b]+.005*level;const t=gate(this.noiseEnv[b],p.threshold,-p.reduction);this.noiseGain[b]=.998*this.noiseGain[b]+.002*t;resultL+=band[0]*this.noiseGain[b];resultR+=band[1]*this.noiseGain[b];}l=resultL;r=resultR;break;
   }
   case 'deesser':case 'crystalizer':{
    const a=1-Math.exp(-2*Math.PI*(p.frequency||3500)/sampleRate);const v=this.pair,h=this.highPair;v[0]=l;v[1]=r;for(let c=0;c<2;c++){this.lp[c]+=a*(v[c]-this.lp[c]);h[c]=v[c]-this.lp[c];}const level=Math.max(Math.abs(h[0]),Math.abs(h[1]));this.highEnv=(this.highEnv||0)*.99+level*.01;
    if(this.kind==='deesser'){const reduction=gain(-Math.min(p.amount,Math.max(0,db(this.highEnv)-p.threshold)));this.g=.98*this.g+.02*reduction;l=this.lp[0]+h[0]*this.g;r=this.lp[1]+h[1]*this.g;}else{const boost=p.amount/100; l+=boost*(h[0]-this.prevHigh[0]);r+=boost*(h[1]-this.prevHigh[1]);this.prevHigh[0]=h[0];this.prevHigh[1]=h[1];}break;
   }
   case 'stereo':{const mid=(l+r)*.5,side=(l-r)*.5*p.width/100;const oldL=l,oldR=r;l=mid+side;r=mid-side;if(p.mode===1)l=r=mid;if(p.mode===2){l=oldR;r=oldL;}if(p.mode===3)l=r=oldL;if(p.mode===4)l=r=oldR;l*=1-Math.max(0,p.balance)/100;r*=1+Math.min(0,p.balance)/100;break;}
   case 'voice':{const mid=(l+r)*.5*p.amount/100;l-=mid;r-=mid;break;}
   case 'crossfeed':case 'crosstalk':{this.ring[0][this.pos]=l;this.ring[1][this.pos]=r;const delay=sampleRate*(this.kind==='crossfeed'?.0003:p.delay/1000);const a=1-Math.exp(-2*Math.PI*(p.cutoff||1800)/sampleRate);this.lp[0]+=a*(read(0,delay)-this.lp[0]);this.lp[1]+=a*(read(1,delay)-this.lp[1]);const amount=p.amount/100*(this.kind==='crossfeed'?1:-1);l=(l+amount*this.lp[1])/(1+Math.abs(amount));r=(r+amount*this.lp[0])/(1+Math.abs(amount));break;}
   case 'crusher':{if(this.tick%p.hold===0){const steps=Math.pow(2,p.bits-1);this.held[0]=Math.round(l*steps)/steps;this.held[1]=Math.round(r*steps)/steps;}l=l*(1-p.mix/100)+this.held[0]*p.mix/100;r=r*(1-p.mix/100)+this.held[1]*p.mix/100;break;}
   case 'pitch':case 'autotune':{
    this.ring[0][this.pos]=l;this.ring[1][this.pos]=r;let ratio=Math.pow(2,(p.semitones||0)/12);
    if(this.kind==='autotune'){if(this.tick%2048===0&&this.env>.01){let best=0,lag=0;for(let d=48;d<800;d+=2){let cross=0,aa=0,bb=0;for(let j=0;j<1024;j+=4){const x=this.ring[0][(this.pos-j+32768)%32768],y=this.ring[0][(this.pos-j-d+32768)%32768];cross+=x*y;aa+=x*x;bb+=y*y;}const corr=cross/Math.sqrt(aa*bb+1e-12);if(corr>best){best=corr;lag=d;}}if(best>.85){const note=69+12*Math.log2(sampleRate/lag/440),scale=p.scale===1?[0,2,4,5,7,9,11]:p.scale===2?[0,2,3,5,7,8,10]:[0,1,2,3,4,5,6,7,8,9,10,11];let nearest=Math.round(note),dist=99;for(let n=Math.floor(note)-3;n<=Math.ceil(note)+3;n++)if(scale.includes(((n-p.root)%12+12)%12)&&Math.abs(n-note)<dist){dist=Math.abs(n-note);nearest=n;}this.pitchRatio=Math.pow(2,(nearest-note)*p.amount/1200);}else this.pitchRatio=1;}ratio=this.pitchRatio;}
    if(Math.abs(ratio-1)>.0001){this.phase=(this.phase+(1-ratio)/this.window+1)%1;const a=this.phase,b=(a+.5)%1,w=.5-.5*Math.cos(2*Math.PI*a);l=read(0,32+a*this.window)*w+read(0,32+b*this.window)*(1-w);r=read(1,32+a*this.window)*w+read(1,32+b*this.window)*(1-w);}break;
   }
  }
  out[0][i]=Number.isFinite(l)?l:0;if(out[1])out[1][i]=Number.isFinite(r)?r:0;this.pos=(this.pos+1)%32768;this.tick++;
 }
 return true;}
}
registerProcessor('edub-dsp',EdubDSP);

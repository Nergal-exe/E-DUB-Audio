import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
let DSP;class Base{constructor(){this.port={onmessage:null,postMessage(){}};}}
vm.runInNewContext(fs.readFileSync('public/dsp-worklet.js','utf8'),{sampleRate:48000,AudioWorkletProcessor:Base,registerProcessor:(_name,klass)=>DSP=klass});
const rms=a=>Math.sqrt(a.reduce((sum,v)=>sum+v*v,0)/a.length);
function run(kind,values,signal,seconds=1){const processor=new DSP({processorOptions:{kind,values}});const left=[],right=[];for(let offset=0;offset<seconds*48000;offset+=128){const input=[new Float32Array(128),new Float32Array(128)],out=[new Float32Array(128),new Float32Array(128)];for(let i=0;i<128;i++){const sample=signal((offset+i)/48000);input[0][i]=Array.isArray(sample)?sample[0]:sample;input[1][i]=Array.isArray(sample)?sample[1]:sample;}processor.process([input],[out]);left.push(...out[0]);right.push(...out[1]);}assert(left.every(Number.isFinite)&&right.every(Number.isFinite),kind+' finite');return [left,right];}
const sine=(amplitude=.5,hz=440)=>t=>amplitude*Math.sin(2*Math.PI*hz*t);
const gate=run('gate',{threshold:-30,range:-60,release:30},sine(.005));assert(rms(gate[0].slice(24000))<.00001,'Gate must reduce quiet input');
const limiter=run('limiter',{ceiling:-6,release:80},sine(1.5));assert(Math.max(...limiter[0].map(Math.abs))<=10**(-6/20)+1e-6,'Limiter ceiling');
const impulse=run('limiter',{ceiling:-6,release:80},t=>Math.round(t*48000)%1000===0?2:0);assert(Math.max(...impulse[0].map(Math.abs))<=10**(-6/20)+1e-6,'Impulse ceiling');
const mono=run('stereo',{width:0,balance:0,mode:0},t=>[Math.sin(t*2000),0]);assert(mono[0].every((v,i)=>v===mono[1][i]),'Width zero must be mono');
const voice=run('voice',{amount:100},sine());assert(rms(voice[0])===0,'Center removal');
const bands=run('multicomp',{low:0,mid:0,high:0,ratio:1},sine());assert(Math.abs(rms(bands[0])-.5/Math.sqrt(2))<.001,'Unity multiband reconstruction');
const pitch=run('pitch',{semitones:12},sine());let crossings=0;for(let i=24001;i<48000;i++)if(pitch[0][i-1]<=0&&pitch[0][i]>0)crossings++;assert(Math.abs(crossings*2-880)<30,'Pitch up one octave');
const crusher=run('crusher',{bits:4,hold:4,mix:100},sine());assert(crusher[0].every(v=>Math.abs(v*8-Math.round(v*8))<1e-6),'Bit depth quantization');
const noise=run('noise',{threshold:-20,reduction:20},sine(.001));assert(rms(noise[0].slice(24000))<.0001,'Noise reduction');
for(const kind of ['expander','autogain','multigate','deesser','crystalizer','crossfeed','crosstalk','autotune'])run(kind,{threshold:-30,ratio:2,target:-20,max:9,low:-30,mid:-30,high:-30,range:-40,frequency:5000,amount:30,cutoff:700,delay:.25,root:0,scale:0},sine());
console.log('PASS: limiter sine/impulse ceilings, gate, multiband reconstruction, mono, center removal, pitch octave, quantization, noise reduction, finite output.');

import { Rnnoise } from './vendor/rnnoise.js';
let state;
self.onmessage=async({data})=>{try{if(data.type==='init'){state=(await Rnnoise.load()).createDenoiseState();postMessage({type:'ready'});}else if(data.type==='frame'){const frame=data.frame;for(let i=0;i<frame.length;i++)frame[i]*=32768;state.processFrame(frame);for(let i=0;i<frame.length;i++)frame[i]/=32768;postMessage({type:'frame',frame},[frame.buffer]);}else if(data.type==='dispose'){state?.destroy();close();}}catch(e){postMessage({type:'error',message:String(e)});}};

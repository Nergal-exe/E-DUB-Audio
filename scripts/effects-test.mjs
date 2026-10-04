import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:5173');await page.waitForLoadState('networkidle');
 await page.getByRole('button',{name:'Efekt ekle',exact:true}).click();
 assert.equal(await page.locator('.library-effect').count(),31);
 await page.getByLabel('Efekt ara').fill('Deep');assert.equal(await page.locator('.library-effect').count(),1);
 await page.getByLabel('Efekt ara').fill('');await page.screenshot({path:'test-results/effect-library.png'});
 await page.getByRole('button',{name:'Delay ekle',exact:true}).click();await page.getByRole('heading',{name:'Delay',exact:true}).waitFor();
 await page.getByRole('slider',{name:'Gecikme',exact:true}).fill('500');
 await page.reload();await page.waitForLoadState('networkidle');await page.locator('.effect-item').filter({hasText:'Delay'}).click();assert.equal(await page.getByRole('slider',{name:'Gecikme',exact:true}).inputValue(),'500');
 await page.getByRole('switch',{name:'Delay etkinleştir'}).click();
 const result=await page.evaluate(async()=>{
  const {AudioEngine,createDefaults,parseAutoEQ}=await import('/src/audio.ts');const {effects}=await import('/src/effects.ts');
  const audio=document.createElement('audio'),events=[];const engine=new AudioEngine(audio,message=>events.push(message));await engine.context.resume();const osc=engine.context.createOscillator();osc.frequency.value=440;const quiet=engine.context.createGain();quiet.gain.value=.02;osc.connect(quiet);quiet.connect(engine.input);osc.start();const s=createDefaults();s.chain=effects.map(e=>e.id);const measurements=[];
  for(const effect of effects){if(effect.id==='echo')continue;Object.values(s.effects).forEach(e=>e.enabled=false);s.effects[effect.id].enabled=true;if(effect.id==='convolver'){const bytes=new ArrayBuffer(44+4800*2),v=new DataView(bytes);const str=(at,t)=>[...t].forEach((c,i)=>v.setUint8(at+i,c.charCodeAt(0)));str(0,'RIFF');v.setUint32(4,36+9600,true);str(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,48000,true);v.setUint32(28,96000,true);v.setUint16(32,2,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,9600,true);v.setInt16(44,16000,true);await engine.loadIR(new File([bytes],'impulse.wav'));}
   const start=performance.now();await engine.update(s);await new Promise(r=>setTimeout(r,effect.id==='deep'||effect.id==='rnnoise'?1200:100));const levels=engine.getLevels();measurements.push({id:effect.id,peak:levels.peak,ms:Math.round(performance.now()-start)});
  }
  const profile=parseAutoEQ('Preamp: -5 dB\nFilter 1: ON PK Fc 1234 Hz Gain 4 dB Q 2\nFilter 2: ON LS Fc 100 Hz Gain 2 dB Q 0.7');let rejected=false;try{parseAutoEQ('Filter 1: ON PK Fc 99999 Hz Gain 20 dB Q 1');}catch{rejected=true;}
  osc.stop();await engine.dispose();return {events,measurements,profile,rejected,diagnostics:engine.diagnostics};
 });
 console.log(JSON.stringify(result,null,2));assert.deepEqual(result.events,[]);assert(result.measurements.every(v=>Number.isFinite(v.peak)));assert(result.diagnostics.rnnoiseFrames>40,'RNNoise must process real frames');assert.equal(result.profile.frequencies[0],1234);assert.equal(result.profile.preamp,-5);assert(result.rejected);
 await page.getByRole('button',{name:'Mikrofon',exact:true}).click();await page.getByRole('button',{name:'Mikrofonu durdur',exact:true}).waitFor();assert.equal(await page.getByRole('switch',{name:'Mikrofonu kulaklıkta dinle'}).getAttribute('data-state'),'unchecked');await page.getByRole('button',{name:'Mikrofonu durdur',exact:true}).click();
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Efekt kütüphanesi',exact:true}).click();await page.screenshot({path:'test-results/effects-mobile.png',fullPage:true});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);console.log('PASS: library, persistence, all processor initialization, AutoEQ, fake microphone start/stop, mobile.');
}finally{await browser.close();}

import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
await fs.mkdir('test-results',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1040}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto('http://127.0.0.1:5173');await page.waitForLoadState('networkidle');
 console.log((await page.getByRole('button').allTextContents()).join(' | '));
 await page.screenshot({path:'test-results/studio-dark.png',fullPage:true});
 await page.getByRole('button',{name:'Açık temaya geç'}).click();
 assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
 await page.reload();await page.waitForLoadState('networkidle');
 assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
 await page.screenshot({path:'test-results/studio-light.png',fullPage:true});
 await page.getByRole('button',{name:'Bas vurgusu',exact:true}).click();
 assert.equal(await page.getByRole('slider',{name:'31 Hz kazanç',exact:true}).inputValue(),'6');
 await page.getByRole('button',{name:'Profili kaydet',exact:true}).click();
 await page.getByLabel('Profil adı').fill('Test profili');
 await page.getByRole('dialog').getByRole('button',{name:'Profili kaydet'}).click();
 await page.getByRole('button',{name:'Ses profilleri',exact:true}).click();
 assert.equal(await page.getByRole('heading',{name:'Test profili'}).count(),1);
 await page.getByRole('button',{name:'Ayarlar',exact:true}).click();await page.getByRole('button',{name:'Hakkında',exact:true}).click();
 await page.getByRole('dialog').getByText('tablet evi',{exact:false}).waitFor();
 await page.screenshot({path:'test-results/about.png'});
 await page.getByRole('button',{name:'Genel',exact:true}).click();
 await page.getByRole('dialog').getByRole('button',{name:'Sıfırla',exact:true}).click();
 await page.getByRole('button',{name:'Varsayılana dön',exact:true}).click();
 assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
 await page.getByRole('button',{name:'Kapat',exact:true}).click();
 await page.getByRole('button',{name:'Ses stüdyosu',exact:true}).click();
 assert.equal(await page.getByRole('slider',{name:'31 Hz kazanç',exact:true}).inputValue(),'0');
 // Generate a short low-amplitude tone to validate the real playback path.
 const samples=44100*4;const wav=Buffer.alloc(44+samples*2);wav.write('RIFF',0);wav.writeUInt32LE(36+samples*2,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(44100,24);wav.writeUInt32LE(88200,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(samples*2,40);for(let i=0;i<samples;i++)wav.writeInt16LE(Math.round(Math.sin(i*2*Math.PI*440/44100)*1500),44+i*2);
 await page.getByLabel('Ses dosyası yükle').setInputFiles({name:'test-tone.wav',mimeType:'audio/wav',buffer:wav});
 await page.getByRole('button',{name:'Oynat',exact:true}).click();
 await page.getByText('Ses analiz ediliyor',{exact:true}).waitFor();
 assert.equal(await page.locator('audio').evaluate(a=>a.paused),false);
 await page.getByRole('button',{name:'Duraklat',exact:true}).click();
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'test-results/mobile.png',fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,'Mobile horizontal overflow');
 assert.deepEqual(errors,[]);
 console.log('PASS: theme persistence, presets, about, reset, real audio playback, mobile overflow, no JS errors.');
}finally{await browser.close();}


import {_electron} from '@playwright/test';
import assert from 'node:assert/strict';
const app=await _electron.launch({executablePath:process.env.EDUB_EXE||process.cwd()+'/node_modules/electron/dist/electron.exe',args:[...(process.env.EDUB_EXE?[]:['.']),'--user-data-dir='+process.cwd()+'/test-results/device-regression-profile']});
try{
 const page=await app.firstWindow();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.getByRole('button',{name:'Ayarlar',exact:true}).waitFor();await page.evaluate(()=>localStorage.clear());await page.reload();
 await page.getByRole('button',{name:'Ayarlar',exact:true}).click();await page.getByRole('button',{name:'Cihazlar ve ön ayarlar',exact:true}).click();await page.getByRole('button',{name:'Cihazları algıla',exact:true}).click();await page.getByText(/çıkış cihazı bulundu/).waitFor();
 const counts={input:await page.getByLabel('Ses giriş cihazı',{exact:true}).locator('option').count(),output:await page.getByLabel('Ses çıkış cihazı',{exact:true}).locator('option').count()};console.log('Real Windows detection:',counts,await page.getByText(/çıkış cihazı bulundu/).textContent());assert.ok(counts.output>1,'Physical Windows output must be found');
 await page.getByRole('button',{name:'Muafiyetler',exact:true}).click();assert.equal(await page.getByLabel('Muafiyet türü').inputValue(),'file');await page.getByLabel('Muaf tutulacak ad').fill('regression');await page.getByLabel('Muaf tutulacak ad').press('Enter');await page.getByText('regression',{exact:true}).waitFor();await page.getByLabel('Muaf tutulacak ad').fill('regression');await page.getByRole('button',{name:'Muafiyet ekle',exact:true}).click();await page.getByText('Bu muafiyet zaten listede.',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Kapat',exact:true}).click();await page.getByLabel('Ses dosyası yükle').setInputFiles({name:'regression.wav',mimeType:'audio/wav',buffer:Buffer.alloc(44)});await page.getByText('Muaf kaynak: regression. Efektler atlanıyor.',{exact:true}).waitFor();assert.equal(await page.locator('.signal-flow').textContent(),'KaynakBypassÇıkış');
 await page.reload();await page.getByRole('button',{name:'Ayarlar',exact:true}).click();await page.getByRole('button',{name:'Muafiyetler',exact:true}).click();await page.getByText('regression',{exact:true}).waitFor();await page.getByRole('button',{name:'regression muafiyetini kaldır',exact:true}).click();assert.equal(await page.locator('.settings-list strong').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS: native device button, actual devices, exclusion Enter/click, duplicate validation, bypass indicator, persistence and removal');
}finally{await app.close();}



import {_electron} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const profile=path.resolve('test-results/lifecycle-profile');await fs.mkdir(profile,{recursive:true});await fs.writeFile(path.join(profile,'lifecycle.json'),JSON.stringify({startAtLogin:false,shutdownOnClose:true,hideOnStartup:false}));
const launch=()=>_electron.launch({executablePath:path.resolve('release/win-unpacked/E-DUB Audio.exe'),args:[`--user-data-dir=${profile}`]});
let app=await launch();
try{
 const page=await app.firstWindow();await page.getByRole('heading',{name:'Sesine şekil ver.'}).waitFor();
 // Exercise startup IPC with intercepted OS APIs; do not change this user's login entries.
 await app.evaluate(({app})=>{globalThis.loginCalls=[];app.getLoginItemSettings=()=>({openAtLogin:globalThis.loginCalls.at(-1)?.openAtLogin||false});app.setLoginItemSettings=value=>globalThis.loginCalls.push(value);});
 await page.getByRole('button',{name:'Ayarlar',exact:true}).click();await page.getByRole('switch',{name:'Girişte uygulamayı başlat',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('[aria-label="Girişte uygulamayı başlat"]').getAttribute('data-state')==='checked');
 let calls=await app.evaluate(()=>globalThis.loginCalls);assert.equal(calls.length,1);assert.equal(calls[0].openAtLogin,true);assert.deepEqual(calls[0].args,['--autostart']);assert(calls[0].path.endsWith('E-DUB Audio.exe'));
 await page.getByRole('switch',{name:'Girişte uygulamayı başlat',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[aria-label="Girişte uygulamayı başlat"]').getAttribute('data-state')==='unchecked');
 await page.getByRole('switch',{name:'Pencere kapatıldığında tamamen kapat',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[aria-label="Pencere kapatıldığında tamamen kapat"]').getAttribute('data-state')==='unchecked');
 await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].close());assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].isVisible()),false);assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().length),1);
 await app.evaluate(({app})=>app.emit('second-instance'));assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].isVisible()),true);
 await page.getByRole('switch',{name:'Başlangıçta pencereyi gizle',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[aria-label="Başlangıçta pencereyi gizle"]').getAttribute('data-state')==='checked');await page.screenshot({path:'test-results/settings-windows.png'});
 await app.close();app=await launch();const hidden=await app.firstWindow();await hidden.waitForLoadState('load');await hidden.waitForTimeout(200);assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].isVisible()),false);
 await hidden.evaluate(()=>window.desktop.setLifecycle({hideOnStartup:false,shutdownOnClose:true}));await app.evaluate(({app})=>app.emit('second-instance'));const closed=app.waitForEvent('close');await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].close());await closed;
 console.log('PASS: trusted preload IPC, login registration arguments (OS calls mocked), tray-on-close, restore, hidden startup, full shutdown.');
}finally{await app.close().catch(()=>{});}

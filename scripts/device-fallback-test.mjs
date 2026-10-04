import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{const page=await browser.newPage();await page.goto('http://127.0.0.1:5173');const result=await page.evaluate(async()=>{
 const {detectDevices}=await import('/src/devices.ts');let stopped=false;const output={deviceId:'speaker',kind:'audiooutput',label:'Speaker'};
 const denied=await detectDevices({getUserMedia:async()=>{throw new DOMException('Denied','NotAllowedError');},enumerateDevices:async()=>[output]});
 const good=await detectDevices({getUserMedia:async()=>({getTracks:()=>[{stop:()=>{stopped=true;}}]}),enumerateDevices:async()=>{if(stopped)throw Error('Microphone stopped before enumeration');return [output];}});const clean=stopped;stopped=false;let rejected=false;
 try{await detectDevices({getUserMedia:async()=>({getTracks:()=>[{stop:()=>{stopped=true;}}]}),enumerateDevices:async()=>{throw Error('Enumeration failed');}});}catch{rejected=true;}
 return {fallback:denied.devices.length,warning:!!denied.warning,success:good.devices.length,clean,errorCleanup:stopped&&rejected};});assert.deepEqual(result,{fallback:1,warning:true,success:1,clean:true,errorCleanup:true});console.log('PASS: denied microphone preserves output devices; enumeration occurs before closing microphone; streams released on success and failure');}finally{await browser.close();}

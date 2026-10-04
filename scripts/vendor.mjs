import fs from 'node:fs/promises';
await fs.mkdir('public/vendor',{recursive:true});
for(const [from,to] of [
 ['@lofcz/deepfilternet-web/dist/worklet.js','deep-worklet.js'],
 ['@lofcz/deepfilternet-web/dist/df_bg.wasm','df_bg.wasm'],
 ['@lofcz/deepfilternet-web/LICENSE-MIT','DeepFilterNet-LICENSE-MIT.txt'],
 ['@lofcz/deepfilternet-web/LICENSE-APACHE','DeepFilterNet-LICENSE-APACHE.txt'],
 ['@shiguredo/rnnoise-wasm/dist/rnnoise.js','rnnoise.js'],
 ['@shiguredo/rnnoise-wasm/LICENSE','RNNoise-WASM-LICENSE.txt'],
])await fs.copyFile(`node_modules/${from}`,`public/vendor/${to}`);
// Upstream silently bypasses on initialization failure. Surface readiness/errors
// to the host so the UI never claims an unloaded model is processing audio.
const deepPath='public/vendor/deep-worklet.js';
let deep=await fs.readFile(deepPath,'utf8');
deep=deep.replace('this.#ready = true;', 'this.#ready = true; this.port.postMessage({type: "ready"});');
deep=deep.replace('} catch {\n        this.#ready = false;', '} catch (error) {\n        this.port.postMessage({type: "error", message: String(error)}); this.#ready = false;');
deep=deep.replace('#ready = false;', '#disposed = false;\n    #ready = false;');
deep=deep.replace('this.port.onmessage = (event) => {','this.port.onmessage = (event) => { if(event.data.type === "dispose") { if(this.#ready) wasm.df_free(this.#handle); this.#ready=false;this.#disposed=true;return; }');
deep=deep.replace('process(inputs, outputs) {','process(inputs, outputs) { if(this.#disposed) return false;');
deep=deep.replace('const opts = options.processorOptions;', 'const opts = options.processorOptions; if (!globalThis.crypto) { let at=0; const bytes=opts.randomBytes; globalThis.crypto={getRandomValues(array){ const dest=new Uint8Array(array.buffer,array.byteOffset,array.byteLength); if(at+dest.length>bytes.length) throw new Error("Random buffer exhausted"); dest.set(bytes.subarray(at,at+dest.length));at+=dest.length;return array;}};}');
await fs.writeFile(deepPath,'/* E-DUB modifications: initialization status; AudioWorklet UTF-8 and random seed adapters. */\nimport "../worklet-polyfills.js";\n'+deep);
console.log('Yerel WASM motorları ve lisanslar hazır.');

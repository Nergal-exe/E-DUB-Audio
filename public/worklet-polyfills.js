// AudioWorkletGlobalScope omits TextDecoder in Chromium. UTF-8 decoder for
// wasm-bindgen error strings; no DOM or network APIs are introduced.
if(typeof globalThis.TextDecoder==='undefined')globalThis.TextDecoder=class{
 constructor(_encoding,options={}){this.fatal=options.fatal;}
 decode(bytes=new Uint8Array()){
  const data=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes.buffer||bytes);let out='';
  for(let i=0;i<data.length;){let cp=data[i++],count=0,min=0;if(cp<128){out+=String.fromCharCode(cp);continue;}if(cp>=0xc2&&cp<=0xdf){cp&=31;count=1;min=128;}else if(cp>=0xe0&&cp<=0xef){cp&=15;count=2;min=2048;}else if(cp>=0xf0&&cp<=0xf4){cp&=7;count=3;min=65536;}else{if(this.fatal)throw new TypeError('Invalid UTF-8');out+='\ufffd';continue;}let valid=i+count<=data.length;for(let j=0;j<count&&i<data.length;j++){const b=data[i++];if((b&0xc0)!==0x80)valid=false;cp=(cp<<6)|(b&63);}if(!valid||cp<min||cp>0x10ffff||(cp>=0xd800&&cp<=0xdfff)){if(this.fatal)throw new TypeError('Invalid UTF-8');out+='\ufffd';}else out+=String.fromCodePoint(cp);
  }return out;
 }
};

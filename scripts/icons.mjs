import sharp from 'sharp';
import fs from 'node:fs/promises';
// Preserve the supplied artwork; crop only the empty outer area for small icons.
const source = sharp('Logo.png');
const meta = await source.metadata();
const width = meta.width;
const square = await source.extract({left:Math.round(width*.13),top:Math.round(meta.height*.06),width:Math.round(width*.74),height:Math.round(width*.74)}).resize(256,256).png().toBuffer();
await fs.writeFile('public/app-icon.png',square);
const header=Buffer.alloc(22);header.writeUInt16LE(1,2);header.writeUInt16LE(1,4);header[6]=0;header[7]=0;header.writeUInt16LE(1,10);header.writeUInt16LE(32,12);header.writeUInt32LE(square.length,14);header.writeUInt32LE(22,18);
await fs.writeFile('public/icon.ico',Buffer.concat([header,square]));
console.log('Logo tabanlı PNG ve Windows ICO hazır.');

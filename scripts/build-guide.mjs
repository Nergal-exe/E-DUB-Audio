// docs/E-DUB-Audio-Amac-ve-Ozellikler.pdf dosyasını yeniden üretir: efekt tanımlarını src/effects.ts'ten alıp scripts/build-guide.py'ye verir.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
const root = process.cwd();
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'edub-guide-'));
try {
 const bundle = path.join(temp, 'effects.mjs');
 await build({ entryPoints: [path.join(root, 'src/effects.ts')], bundle: true, format: 'esm', outfile: bundle, logLevel: 'warning' });
 const { effects } = await import(pathToFileURL(bundle).href);
 const json = path.join(temp, 'effects.json');
 fs.writeFileSync(json, JSON.stringify(effects));
 const python = process.platform === 'win32' ? 'py' : 'python3';
 const result = spawnSync(python, [path.join(root, 'scripts/build-guide.py'), root, json], { stdio: 'inherit', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
 if (result.error) throw new Error(`${python} çalıştırılamadı: ${result.error.message}`);
 process.exitCode = result.status ?? 1;
} finally { fs.rmSync(temp, { recursive: true, force: true }); }

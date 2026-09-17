import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'www');
const webAssets = [
  'index.html',
  'privacy.html',
  'terms.html',
  'manifest.json',
  'service-worker.js',
  'apple-touch-icon.png',
  'icon-512.png',
  'bgm-cyber.mp3',
  'bgm-fancy.mp3'
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const asset of webAssets) {
  await cp(resolve(root, asset), resolve(output, asset));
}

console.log(`Prepared ${webAssets.length} web assets in ${output}`);

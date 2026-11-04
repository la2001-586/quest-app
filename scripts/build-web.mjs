import { execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'www');
const webAssets = [
  'index.html',
  'privacy.html',
  'terms.html',
  'evidence.html',
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

const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
let revision = String(process.env.GITHUB_SHA || '').slice(0, 7);
if (!revision) {
  try {
    revision = execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    revision = 'unknown';
  }
}
const outputIndex = resolve(output, 'index.html');
const builtHtml = (await readFile(outputIndex, 'utf8')).replace(
  /(<div id="buildTag" class="stb-version">)BUILD v[^<]+(<\/div>)/,
  `$1BUILD v${pkg.version} · ${revision.toUpperCase()}$2`,
);
await writeFile(outputIndex, builtHtml);

console.log(`Prepared ${webAssets.length} web assets in ${output} (v${pkg.version} · ${revision})`);

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const version = pkg.version;
const versionCode = Number(version.replace(/\D/g, ''));

if (!/^\d+\.\d+\.\d+$/.test(version) || !Number.isInteger(versionCode) || versionCode <= 0) {
  throw new Error(`Unsupported package version: ${version}`);
}

async function replaceChecked(file, replacements) {
  const path = resolve(root, file);
  let contents = await readFile(path, 'utf8');
  for (const [pattern, replacement, label] of replacements) {
    if (!pattern.test(contents)) throw new Error(`${file}: ${label} was not found`);
    contents = contents.replace(pattern, replacement);
  }
  await writeFile(path, contents);
}

await replaceChecked('index.html', [
  [/(<div id="buildTag" class="stb-version">)BUILD v[^<]+(<\/div>)/, `$1BUILD v${version}$2`, 'visible build label'],
]);
await replaceChecked('manifest.json', [
  [/"start_url"\s*:\s*"\.\/index\.html(?:\?app_version=[^"]+)?"/, `"start_url": "./index.html?app_version=${version}"`, 'versioned start URL'],
]);
await replaceChecked('version.json', [
  [/"version"\s*:\s*"[^"]+"/, `"version": "${version}"`, 'web update version'],
]);
await replaceChecked('android/app/build.gradle', [
  [/versionCode\s+\d+/, `versionCode ${versionCode}`, 'Android versionCode'],
  [/versionName\s+"[^"]+"/, `versionName "${version}"`, 'Android versionName'],
]);
await replaceChecked('ios/App/App.xcodeproj/project.pbxproj', [
  [/CURRENT_PROJECT_VERSION = \d+;/g, `CURRENT_PROJECT_VERSION = ${versionCode};`, 'iOS build number'],
  [/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`, 'iOS marketing version'],
]);
await replaceChecked('evidence.html', [
  [/監査対象：v[^ ]+ 系の現行機能/, `監査対象：v${version} 系の現行機能`, 'evidence scope'],
]);

console.log(`Synchronized Daily Station v${version} (build ${versionCode})`);

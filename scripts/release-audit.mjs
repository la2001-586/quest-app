import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (file) => readFile(resolve(root, file), 'utf8');

const [pkgRaw, manifestRaw, capacitorRaw, androidGradle, index, privacy, terms, worker] = await Promise.all([
  read('package.json'),
  read('manifest.json'),
  read('capacitor.config.json'),
  read('android/app/build.gradle'),
  read('index.html'),
  read('privacy.html'),
  read('terms.html'),
  read('service-worker.js')
]);

const pkg = JSON.parse(pkgRaw);
const manifest = JSON.parse(manifestRaw);
const capacitor = JSON.parse(capacitorRaw);
const errors = [];
const warnings = [];
const passed = [];

const pass = (message) => passed.push(message);
const error = (message) => errors.push(message);
const warn = (message) => warnings.push(message);

const androidVersionName = androidGradle.match(/versionName\s+"([^"]+)"/)?.[1];
const androidVersionCode = Number(androidGradle.match(/versionCode\s+(\d+)/)?.[1]);
const expectedVersionCode = Number(pkg.version.replace(/\D/g, ''));

if (androidVersionName === pkg.version) pass(`package and Android version agree (${pkg.version})`);
else error(`package version ${pkg.version} does not match Android versionName ${androidVersionName ?? 'missing'}`);

if (androidVersionCode === expectedVersionCode) pass(`Android versionCode agrees (${androidVersionCode})`);
else error(`Android versionCode ${androidVersionCode || 'missing'} does not match ${expectedVersionCode}`);

if (capacitor.appId === 'com.dailystation.app' && capacitor.appName === 'Daily Station') {
  pass('Capacitor application identity is fixed');
} else {
  error('Capacitor appId/appName changed from the release identity');
}

for (const key of ['id', 'name', 'short_name', 'description', 'start_url', 'scope', 'display', 'icons']) {
  if (!manifest[key] || (Array.isArray(manifest[key]) && manifest[key].length === 0)) {
    error(`manifest field is missing: ${key}`);
  }
}
if (manifest.display === 'standalone') pass('web app manifest uses standalone display');
else warn(`manifest display is ${manifest.display}; standalone was expected`);

const icon512 = manifest.icons?.find((icon) => String(icon.sizes).split(/\s+/).includes('512x512'));
if (icon512) pass('512px install icon is declared');
else error('manifest has no 512x512 install icon');

for (const file of ['privacy.html', 'terms.html', 'manifest.json', 'apple-touch-icon.png', 'icon-512.png']) {
  try {
    const info = await stat(resolve(root, file));
    if (!info.isFile() || info.size === 0) error(`${file} is missing or empty`);
  } catch {
    error(`${file} is missing`);
  }
}

if (index.includes('Content-Security-Policy')) pass('Content Security Policy is present');
else error('Content Security Policy is missing');
if (index.includes('privacy.html') && index.includes('terms.html')) pass('legal pages are linked from the app');
else error('privacy or terms link is missing from the app');
if (/support@quest-app-demo|@gmail\.com/i.test(index + privacy + terms)) {
  error('placeholder or personal support address remains');
}

if (privacy.includes('GitHub Issues') || terms.includes('GitHub Issues')) {
  warn('support currently uses public GitHub Issues; choose a private support address before store submission');
}
if (privacy.includes('ストア公開前') || terms.includes('ストア公開前')) {
  warn('legal text still says the support route will change before store release');
}
if (worker.includes('registration.unregister')) {
  warn('service worker intentionally unregisters itself; web install works without offline caching');
}
if (index.length > 900_000) {
  warn(`index.html is ${(index.length / 1024).toFixed(0)} KiB; split assets before a high-traffic launch`);
}

console.log('Daily Station release audit');
for (const message of passed) console.log(`PASS  ${message}`);
for (const message of warnings) console.log(`WARN  ${message}`);
for (const message of errors) console.error(`FAIL  ${message}`);
console.log(`Summary: ${passed.length} passed, ${warnings.length} warnings, ${errors.length} failures`);

if (errors.length) process.exitCode = 1;

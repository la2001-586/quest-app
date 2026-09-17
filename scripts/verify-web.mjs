import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const htmlPath = resolve(root, 'www', 'index.html');
const html = await readFile(htmlPath, 'utf8');
const requiredFiles = [
  'privacy.html',
  'terms.html',
  'manifest.json',
  'service-worker.js',
  'apple-touch-icon.png',
  'icon-512.png',
  'bgm-cyber.mp3',
  'bgm-fancy.mp3'
];

const failures = [];

if (!html.includes('BUILD 0917_SUPPORT_PRIVACY_V425')) {
  failures.push('support privacy build tag V425 is missing');
}

for (const marker of ['quest-task-time-log-v1', 'beginTodayTaskTimer', 'finishScheduledTaskTiming', 'task-time-summary']) {
  if (!html.includes(marker)) failures.push(`task timer marker is missing: ${marker}`);
}

for (const marker of [
  'Content-Security-Policy',
  'privacy.html',
  'terms.html',
  'https://github.com/la2001-586/quest-app/issues/new',
  'version: 6',
  "mementoDraft: 'quest-memento-draft-v1'",
  "startPage: 'quest-start-page-v1'",
  "textScale: 'quest-textscale-v1'"
]) {
  if (!html.includes(marker)) failures.push(`release marker is missing: ${marker}`);
}

const forbiddenMarkers = [
  'support@quest-app-demo',
  'api.anthropic.com',
  'VAPID_PUBLIC_KEY',
  'devAddExp',
  'devResetExp',
  'syncRemindersToServer',
  'loadNotificationPrefs',
  '現役医学生',
  '本文はハリボテ',
  'Developer Only (remove before launch)',
  'Show debug log (to be removed)'
];
for (const marker of forbiddenMarkers) {
  if (html.includes(marker)) failures.push(`release-only content remains: ${marker}`);
}
if (/@gmail\.com/i.test(html)) failures.push('a personal Gmail address remains in the web bundle');

if (!/<head[\s>]/i.test(html) || !/<\/head>/i.test(html)) {
  failures.push('index.html must contain a complete <head> for Capacitor');
}

const styleBlocks = html.match(/<style>[\s\S]*?<\/style>/gi) ?? [];
let braceBalance = 0;
for (const block of styleBlocks) {
  for (const char of block) {
    if (char === '{') braceBalance += 1;
    if (char === '}') braceBalance -= 1;
  }
}
if (braceBalance !== 0) failures.push(`CSS brace balance is ${braceBalance}`);

for (const file of requiredFiles) {
  try {
    const info = await stat(resolve(root, 'www', file));
    if (!info.isFile() || info.size === 0) failures.push(`${file} is empty`);
  } catch {
    failures.push(`${file} was not copied to www`);
  }
}

if (failures.length) {
  console.error(failures.map((failure) => `FAIL: ${failure}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log('Web bundle checks passed.');
}

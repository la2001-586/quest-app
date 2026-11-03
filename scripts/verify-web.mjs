import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const htmlPath = resolve(root, 'www', 'index.html');
const html = await readFile(htmlPath, 'utf8');
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const requiredFiles = [
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

const failures = [];

const escapedVersion = pkg.version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
if (!new RegExp(`BUILD v${escapedVersion} · [A-F0-9]{7}`).test(html)) {
  failures.push(`generated build label for v${pkg.version} with a Git revision is missing`);
}
if (html.includes('BUILD 0917_SUPPORT_PRIVACY_V425')) {
  failures.push('legacy hard-coded build label remains');
}

for (const marker of ['quest-task-time-log-v1', 'beginTodayTaskTimer', 'finishScheduledTaskTiming', 'task-time-summary']) {
  if (!html.includes(marker)) failures.push(`task timer marker is missing: ${marker}`);
}

for (const marker of ['id="panel-routine"', 'id="list-routine"', "const ROUTINE_LEVEL = 'routine'", 'normalizeRoutineKey']) {
  if (!html.includes(marker)) failures.push(`unified routine marker is missing: ${marker}`);
}

for (const marker of [
  'id="routineProgressRing"',
  'routineCompletedAt',
  'formatRoutineCompletionTime',
  'renderRoutineProgress',
  'animateRoutinePercent',
  'routineConnectorDraw',
  'routinePrismSweep',
  'prism-bump',
  'routine-overview',
  'routine-add-label',
  'routine-timeline-center',
  'routineItemRiseAligned'
]) {
  if (!html.includes(marker)) failures.push(`routine progress marker is missing: ${marker}`);
}

for (const marker of [
  'Content-Security-Policy',
  'privacy.html',
  'terms.html',
  'evidence.html',
  'https://github.com/la2001-586/quest-app/issues/new',
  'version: 6',
  "mementoDraft: 'quest-memento-draft-v1'",
  "startPage: 'quest-start-page-v1'",
  "textScale: 'quest-textscale-v1'"
]) {
  if (!html.includes(marker)) failures.push(`release marker is missing: ${marker}`);
}

for (const marker of [
  'アプリ説明・チュートリアル',
  'Daily Stationへようこそ',
  '根拠も限界も、いつでも確認',
  'id="tutorialProgressFill"',
  'TUTORIAL_STEPS_JA',
  'View references and sources'
]) {
  if (!html.includes(marker)) failures.push(`about/tutorial marker is missing: ${marker}`);
}

for (const marker of [
  'V427: ONE-SURFACE LAYOUT',
  '--single-surface-line',
  'body.multipage-mode #page-settings > .settings-group + .settings-group',
  'body.prism-motion-ui.multipage-mode #appGroupWrap_group_task::after { content:none'
]) {
  if (!html.includes(marker)) failures.push(`one-surface layout marker is missing: ${marker}`);
}

for (const marker of [
  'V428: VISIBLE REORDER + WIDE CALENDAR',
  'class="routine-drag-handle"',
  "attachDragHandlers(div.querySelector('.routine-drag-handle'), div, task)",
  'body.prism-motion-ui.multipage-mode #appGroupWrap_group_calendar',
  '並び順を保存しました'
]) {
  if (!html.includes(marker)) failures.push(`reorder/calendar layout marker is missing: ${marker}`);
}

for (const marker of [
  'V429: EXCLUSIVE LIFT-TO-REORDER',
  'const gestureArbiter = (() =>',
  "gestureArbiter.claim('routine-reorder'",
  "gestureArbiter.claim('swipe-delete'",
  'routine-drop-placeholder',
  'routine-dragging-wrap',
  'setPointerCapture(e.pointerId)'
]) {
  if (!html.includes(marker)) failures.push(`exclusive gesture marker is missing: ${marker}`);
}

for (const marker of [
  'V430: 猫はカードの overflow に切られない',
  'id="peekCatLayer" class="peek-cat-layer"',
  'positionPeekCatLayer',
  'requestPeekCatPosition',
  'z-index: 10040'
]) {
  if (!html.includes(marker)) failures.push(`top-layer cat marker is missing: ${marker}`);
}

for (const marker of [
  'MOOD_JOURNAL_TEMPLATE_JA',
  '◆今日の目標┈┈┈┈┈┈┈┈┈┈',
  '◆今日の内容┈┈┈┈┈┈┈┈┈┈',
  '・今日のスケジュール',
  '・一番の学び',
  '・一番の反省',
  '・次の目標',
  '◆その他┈┈┈┈┈┈┈┈┈┈'
]) {
  if (!html.includes(marker)) failures.push(`diary template marker is missing: ${marker}`);
}
const diaryScheduleIndex = html.indexOf('・今日のスケジュール');
const diaryLearningIndex = html.indexOf('・一番の学び');
if (diaryScheduleIndex < 0 || diaryLearningIndex < 0 || diaryScheduleIndex > diaryLearningIndex) {
  failures.push('diary schedule prompt must appear immediately before the learning prompt');
}

for (const marker of [
  'V432: NAMELESS ROUTINE DIVIDERS',
  'quest-routine-layout-v1',
  'ROUTINE_DIVIDERS',
  'routine-divider-wrap',
  'routine-divider-card',
  '長押しして区切りを並べ替え',
  'syncRoutineLayoutFromDOM',
  "gestureArbiter.claim('routine-reorder'"
]) {
  if (!html.includes(marker)) failures.push(`routine divider marker is missing: ${marker}`);
}
for (const marker of ['routine-zone-start', 'routine-divider-label', '朝のルーティン', '日中のルーティン', '夜のルーティン']) {
  if (html.includes(marker)) failures.push(`named routine divider content remains: ${marker}`);
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
  'Show debug log (to be removed)',
  'id="routineEditLevel"',
  'id="panel-low"',
  'id="panel-mid"',
  'id="panel-high"'
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

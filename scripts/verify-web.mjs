import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const htmlPath = resolve(root, 'www', 'index.html');
const html = await readFile(htmlPath, 'utf8');
const evidence = await readFile(resolve(root, 'www', 'evidence.html'), 'utf8');
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const requiredFiles = [
  'privacy.html',
  'terms.html',
  'evidence.html',
  'manifest.json',
  'service-worker.js',
  'apple-touch-icon.png',
  'icon-512.png',
  'barcode-detector.js',
  'zxing_reader.wasm',
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
  'class="settings-btn settings-evidence-link" href="evidence.html"',
  '科学的根拠・参考文献',
  '各機能と研究の対応、言えること・言えないことを確認できます。',
  'Evidence & References'
]) {
  if (!html.includes(marker)) failures.push(`evidence access marker is missing: ${marker}`);
}

for (const marker of [
  'class="evidence-topbar"',
  'class="page-shell"',
  'class="section-nav"',
  'id="features"',
  'td:nth-child(3)::before { content:"研究との対応"; }'
]) {
  if (!evidence.includes(marker)) failures.push(`unified evidence UI marker is missing: ${marker}`);
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

for (const marker of [
  'V433: IMMUTABLE BOTTOM NAV',
  'id="persistentBottomNav"',
  'initPersistentBottomNav',
  'const bodyZoom =',
  'requestPersistentBottomNavSync',
  'window.visualViewport.addEventListener',
  '#persistentBottomNav > .home-bar'
]) {
  if (!html.includes(marker)) failures.push(`persistent bottom navigation marker is missing: ${marker}`);
}

for (const marker of [
  'V438: 日課の本文を先に読み',
  'class="routine-tools-lower"',
  '.routine-tools-lower #comboHint-routine'
]) {
  if (!html.includes(marker)) failures.push(`routine content-first layout marker is missing: ${marker}`);
}

const routineListPos = html.indexOf('id="list-routine"');
const routineProgressPos = html.indexOf('id="routineProgressGlass"');
const routineStockPos = html.indexOf('class="routine-stock-link"');
const routineComboPos = html.indexOf('id="comboHint-routine"');
if (!(routineListPos >= 0 && routineListPos < routineProgressPos && routineListPos < routineStockPos && routineListPos < routineComboPos)) {
  failures.push('routine list must precede progress, stock, and combo UI');
}

for (const marker of [
  'V439: 日記本文は内側でスクロールさせず',
  'function resizeMoodJournalTextarea()',
  "el.style.height = 'auto'",
  'el.scrollHeight + borderHeight',
  "groupKey === 'group_diary'",
  'overflow-y: hidden'
]) {
  if (!html.includes(marker)) failures.push(`auto-growing diary marker is missing: ${marker}`);
}

for (const marker of [
  'V442: DAY DETAIL IS VERTICALLY FIXED, NEVER HORIZONTALLY SCROLLABLE',
  'class="modal-card day-detail-card"',
  'class="day-detail-section-head"',
  'class="evt-row evt-time-row"',
  '#dayDetailModal .evt-time-row .evt-allday',
  'overflow-x: hidden'
]) {
  if (!html.includes(marker)) failures.push(`fixed day detail marker is missing: ${marker}`);
}

for (const marker of [
  'V443: 時計とアラームを包んでいた中間の巨大カードを廃止',
  '#hudHeaderBlock .hud-clock-hero',
  'background: transparent !important',
  'box-shadow: none !important',
  '#hudHeaderBlock #otherWrapAlarm'
]) {
  if (!html.includes(marker)) failures.push(`flat home clock marker is missing: ${marker}`);
}

for (const marker of [
  'V444: KEYBOARD NEVER LIFTS THE BOTTOM NAV',
  'data-keyboard-open="true"',
  '--bottom-nav-keyboard-inset',
  'navigator.virtualKeyboard.overlaysContent = true',
  'stableHeight - visibleBottom > 100',
  "layer.dataset.keyboardOpen = keyboardInset > 0 ? 'true' : 'false'"
]) {
  if (!html.includes(marker)) failures.push(`keyboard-stable bottom navigation marker is missing: ${marker}`);
}

for (const marker of [
  'V445: LIGHT, DIRECT PAGE SWITCHING',
  'prismPageEnterQuick .21s',
  'animation: none !important',
  'touch-action: manipulation',
  'ページ移動時に全カードの再アニメーションは行わない',
  "document.querySelectorAll('.home-tab').forEach(t => t.classList.toggle('active', t.dataset.group === groupKey))",
  "if (!rail.children.length && typeof renderCalRail === 'function')",
  "restartClass(surface, 'prism-page-enter', 260)",
  'グループタブ同士の移動では外側の task ページを毎回閉じ直さず',
  'animatePrismPage();'
]) {
  if (!html.includes(marker)) failures.push(`light page switching marker is missing: ${marker}`);
}

for (const marker of [
  'V446: QUIETER, THINNER TASK DATE BARS',
  'min-height: 25px',
  'font-size: 10.5px',
  "if (diff < 0) return { className: 'is-past', label: '' }",
  "const relationHtml = relation.label ?"
]) {
  if (!html.includes(marker)) failures.push(`quiet task date bar marker is missing: ${marker}`);
}

for (const marker of [
  'V447: ONE OWNER FOR THE CALENDAR DAY RAIL',
  'scroll-snap-stop: normal',
  '.cal-chip.is-centered',
  "gestureArbiter.claim('calendar-rail')",
  "gestureArbiter.release('calendar-rail')",
  '_calRailClickBlockedUntil = performance.now() + 420',
  '}, 160);'
]) {
  if (!html.includes(marker)) failures.push(`single-owner calendar rail marker is missing: ${marker}`);
}
for (const marker of ['function _calSnap()', '_calFireDetent(ch)', '_calSnap();']) {
  if (html.includes(marker)) failures.push(`competing calendar rail signal remains: ${marker}`);
}

for (const marker of [
  'V448: ZOOM-SAFE ROUTINE REORDERING',
  'function routineDragBodyZoom()',
  'function routineDragCssPx(visualPx, state)',
  'state.bodyZoom = routineDragBodyZoom()',
  'state.dragVisualHeight = rect.height',
  'routineDragCssPx(rect.left, state)',
  'routineDragCssPx(targetRect.top, state)',
  'filter: drop-shadow(0 16px 20px rgba(31,57,48,.24))'
]) {
  if (!html.includes(marker)) failures.push(`zoom-safe routine reorder marker is missing: ${marker}`);
}

for (const marker of [
  'V449: LIFT THE EXACT CARD, NOT A RESTYLED CARD',
  'function matchRoutineDragVisualSize(element, visualRect, state)',
  'function matchRoutinePlaceholderHeight(placeholder, visualHeight)',
  'function freezeRoutineDragAppearance(state)',
  'function restoreRoutineDragAppearance(state)',
  'ROUTINE_DRAG_APPEARANCE_PROPS',
  'matchRoutineDragVisualSize(state.wrap, rect, state)',
  'state.dragCssWidth = state.wrap.style.width',
  'transform: none !important'
]) {
  if (!html.includes(marker)) failures.push(`exact lifted routine card marker is missing: ${marker}`);
}
for (const marker of [
  '.swipe-del-wrap.routine-dragging-wrap .check-box',
  '.swipe-del-wrap.routine-dragging-wrap .item-label',
  '.routine-divider-wrap.routine-dragging-wrap { padding: 0',
  "state.div.classList.add('dragging')"
]) {
  if (html.includes(marker)) failures.push(`lifted routine card restyling remains: ${marker}`);
}

for (const marker of [
  'V450: ROOMIER EVENT EDITOR',
  'modal-card event-edit-card',
  'class="event-edit-title"',
  'class="event-edit-row event-edit-time-row"',
  'padding: 30px 28px 32px !important',
  'min-height: 70px !important',
  'margin-top: 12px !important'
]) {
  if (!html.includes(marker)) failures.push(`roomier event editor marker is missing: ${marker}`);
}

for (const marker of [
  'V451: PURCHASE SCAN + LINKED TASK ALARMS',
  'id="diaryCaptureModal"',
  'id="barcodeProductModal"',
  'function prepareBarcodeDetector()',
  'function lookupBarcodeProduct()',
  'https://world.openfoodfacts.org/api/v2/product/',
  'https://prices.openfoodfacts.org/api/v1/prices',
  'function syncScheduledEventAlarm(',
  'id="eventEditAlarmLink"',
  'id="dayDetailEventAlarmLink"',
  'sourceEventId',
  '⏰ 連動'
]) {
  if (!html.includes(marker)) failures.push(`purchase scan / linked alarm marker is missing: ${marker}`);
}

for (const marker of [
  'V435: タスクを日付の濃いバーで分け',
  'task-date-group',
  'task-date-bar',
  'taskDateHeadingParts',
  'taskDateRelation',
  'renderDatedScheduledTaskRow',
  "sortedDates = [...groups.keys()].sort",
  'task-item-color-dot'
]) {
  if (!html.includes(marker)) failures.push(`dated task timeline marker is missing: ${marker}`);
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
  'id="panel-high"',
  'V434: 明日の予定と睡眠システム',
  'id="tomorrowPlanText"',
  'id="sleepSoundGrid"'
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

// GitHub Pages currently has both the verified artifact workflow and its legacy
// branch-root publisher enabled. Keep these two public assets identical so
// either publisher produces a working barcode scanner without a CDN fallback.
for (const file of ['barcode-detector.js', 'zxing_reader.wasm']) {
  try {
    const [sourceAsset, builtAsset] = await Promise.all([
      readFile(resolve(root, file)),
      readFile(resolve(root, 'www', file)),
    ]);
    if (!sourceAsset.equals(builtAsset)) failures.push(`${file} in the repository root is out of sync with the verified web bundle`);
  } catch {
    failures.push(`${file} must exist in both the repository root and www`);
  }
}

if (failures.length) {
  console.error(failures.map((failure) => `FAIL: ${failure}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log('Web bundle checks passed.');
}

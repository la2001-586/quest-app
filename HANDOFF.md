# Daily Station — 引き継ぎメモ (Handoff)

別のコーディングエージェント（Codex 等）が続きを引き継ぐための実務メモ。日本語＋コード識別子は英語。

## 0. 一行で
「Daily Station」= 温かい猫テーマの日課／タスク／カレンダー／日記 PWA。**全部 `index.html` 一枚**（約 12,350 行、HTML/CSS/JS すべてインライン、ビルド無し・フレームワーク無し・npm 無し）。

## 1. リポジトリ / デプロイ / 運用ルール
- **Repo**: https://github.com/la2001-586/quest-app
- **デプロイ**: `main` に push → **Netlify が自動ビルド** → オーナーが **iPhone(Safari/PWA)** で実機確認。オーナーは main への直 push を許可済み。
- ミラー用ブランチ `claude/memory-check-y2byvf` にも同内容を push していた（任意）。
- **ビルドタグ**: 画面隅の `#buildTag`（`BUILD 0828_XXX_Vnnn`）。**変更ごとに必ず bump**（実機に反映が来たか確認するため）。現状 `BUILD 0828_CALSWIPE_V405`。
- **実機で直接テストできない**ので、push 前に必ずヘッドレスで描画検証する（§5）。

## 2. アーキテクチャ
- 単一 `index.html`。状態は JS 変数＋`window.storage`(get/set) で永続化。
- **マルチページUI**: `multiPageModeOn`（既定ON）。下ナビ = ホーム/カレンダー/タスク管理/日記/オプション → アプリグループ `group_other / group_calendar / group_task / group_diary / settings`。切替は `switchAppGroup(groupKey)`。
- 主要データ: `picked`(日課完了 Set), `dailyHistory{key:{count,exp,items}}`, `scheduledEvents[]`, `todayTasks[]`, `taskList`(日課定義), `moodJournalData{}`。ヘルパ: `eventsForDate(key)`, `logicalDateKey(trustedNow)`, `attrColor(attr)`, `_calKey(d)`。日付キーは `YYYY-M-D`（0埋め無し）。

## 3. テーマシステム（重要）
`applyThemeClass(themeName)`（既定 `DEFAULT_THEME='simple'`）:
- `simple` → `theme-simple`（明るい）
- `dark` → `theme-simple theme-dark`
- `mono` → `theme-simple theme-mono`（白・エディトリアル）
- `fancy` → `theme-fancy` / `cyber` → クラス無し(基底)
- **落とし穴**: `theme-simple`(1クラス) vs `theme-mono`(2クラス) の詳細度差＋大量の `!important`。色を足すときは全テーマ（明/暗/mono）で見えるか要確認。

## 4. 現在の状態（V411）とこのセッションで入れたもの
0. **AI軌道修正向け日記（V411）**: 日記を自由記述中心から、体力/集中、最大3目標（優先度・状態・予定分）、実績タイムライン、具体的成果、阻害要因、持ち越し判断、今後の制約、体調メモ＋自由メモへ拡張。新規項目は既存 `quest-mood-journal-v1` の各 entry に任意の `aiMeta` として保存するため旧データ互換。コピーは英語の `<AI_INSTRUCTIONS>` と構造化された `<DAILY_LOG>` を生成し、日課・今日のタスク・予定・睡眠も自動で含める。過去日のAIコピーも同形式。ビルドタグ `BUILD 0901_AI_DIARY_V411`。

### V405までの主な実装
1. **星の奥行き視差(dark)**: `buildNightStars()` が星を far/mid/near の3層に分割、スクロールで層ごとに違う距離だけ動く。
2. **完了音「和音＋芯 重厚」**: `playSelectSound()` を旧ビープから、FMベルのメジャーadd9和音＋低いプラック＋サブベースに置換。専用バス `ensureSoundBus()`（**リミッター**＋短いリバーブ）経由。合成ヘルパ `_fmBell/_pluck/_sub/_note`。
3. **タスクの音＆チェック修正**: `toggleScheduledEvent`(カレンダー予定) も完了時に `playSelectSound`。完了チェックが白系テーマで見えなかったのを、濃オレンジ地+白（mono は黒地+白）に修正。
4. **カレンダー連動スライダー**: 月グリッドの下に **日スライダー**(`#calRail`, `scroll-snap-stop:always` のディテント＋触覚＋クリック音) と **その日の詳細**(`#calDayInline`) を追加し、グリッドと相互同期。年月を3か所で強調。`renderCalRail / selectCalDay / renderCalDayInline`。
5. **カレンダーのスワイプ競合修正**: スライダーの横スワイプが「月⇄週⇄日」ビュー切替に被っていたのを、`calSectionWrap` のタッチ判定が `#calRail` 起点を無視するよう修正。
6. (同セッション先行) 週→月の右スワイプ不能を `currentCalView` 追跡で修正、日課/タスクの「起き上がり」アニメ再導入。

## 5. 検証フロー（push 前に必須）
ヘッドレス Chromium(Playwright) でレンダー確認：
- `pageerror` が 0 か
- スクリーンショットで見た目が崩れてないか（明/暗/mono）
- CSS の `{`/`}` バランスが 0 か（下記スニペット）
```js
const h=require('fs').readFileSync('index.html','utf8');
const sm=h.match(/<style>[\s\S]*?<\/style>/g)||[]; let b=0;
sm.forEach(s=>{for(const c of s){if(c==='{')b++;if(c==='}')b--;}}); console.log('CSS braces:',b);
```
- 大きな JS 追加時は主要 `<script>` を `new Function(src)` でパースチェック。
（このセッションでは chromium を `/opt/pw-browsers/...` から使ったが、環境依存。要は「実機の代わりにヘッドレスで必ず見る」）

## 6. 未着手 / 次の候補（優先度順）
1. **庭（植物育成）機能 — 土台A「猫が世話する庭」**（オーナー選定済み）: 日課/タスク完了＝水やり → 植物が 種→芽→双葉→蕾→開花 → 開花で棚にコレクション。**枯れ・死は無し**（サボると育ちが止まるだけ）。鉢は 軽/中/重 の3つ。猫が庭に居る。水やりは `toggleItem`/`toggleTodayTask` にフック、状態は `window.storage`。**見た目は「可愛い/クレイ」路線（写実はNG＝不気味の谷）**。プロト設計済み。
2. **音の統一**: 選択解除・レベルアップ・不意の提案・祝福音を、新しい高級パレット（`_fmBell` 等 + sound bus）に合わせる。
3. **喋る相棒（口パク/まばたき/表情差分）**: 仕組みはプロト済み（口3枚＋まばたき＋呼吸＋タイプ送り＋TTS同期）。**実物の絵素材が必要**（§9）。素材が来れば仕組みで動かせる。
4. **完了音の微調整**（重さ/長さ/残響）— 実機試聴後に要望あれば。

## 7. 落とし穴（gotchas）
- **iOS の音**: Safari の WebAudio は**本体サイレントスイッチ ON で強制無音**（JSで回避不可）。`ctx.resume()` は非同期＝**resume 完了後に鳴らす**。**Web Vibration は iOS 非対応**（Android のみ）。iOS の触覚は `<input type=checkbox switch>` をタップで鳴らす裏技のみ、しかも**直タップ時だけ**（慣性スクロール中は不可）。**フィードバックループ厳禁**（Karplus-Strong で一度爆音事故）→ sound bus に **DynamicsCompressor リミッター**常設。
- **Canvas `isPointInPath` はデバイス座標判定**: `ctx.scale(dpr)` している場合、判定点は `x*dpr, y*dpr` を渡す。
- **カレンダー**: 月/週/日はビュー切替ボタンが無く**スワイプ専用**→ 現在ビューは `currentCalView` 変数で追跡。日スライダー `#calRail` は `calSectionWrap` の内側なので、ビュー切替タッチ判定は `#calRail` 起点を除外。非表示時(`clientWidth=0`)の初期センタリングが scroll-settle と競合するので `_calSuppress` と `clientWidth` ガードで抑止。`renderCalendar` は頻繁に呼ばれるが**レールは再構築しない**（スクロール保持）。レール再構築は selectCalDay(recenter)/月送り/カレンダー表示時フックのみ。
- multipage の flex ルールが `#calMonthSection`/`.cal-grid-shell` を縦に伸ばす → 連動スライダーは `flex:0 0 auto` で上書き。

## 8. 主要コードの場所（`index.html`・概算行、ズレるので関数名で検索）
- `buildNightStars` ~4892（星の視差）
- `ensureSoundBus` ~5114 / `playSelectSound` ~5157 / `_fmBell _pluck _sub _note`（近傍）
- `toggleScheduledEvent` ~6411 / `renderAllTasks` ~6591 / `toggleItem` ~7532 / `toggleTodayTask` ~8221
- `DEFAULT_THEME` ~7387 / `applyThemeClass` ~7388
- `switchAppGroup` ~8412（`group_calendar` でレール再センタ、`group_task` で起き上がり）
- `currentCalView` ~10119 / `switchCalView` ~10120（month でレールフック）
- `renderCalendar` ~10652 / `renderCalRail` ~10776 / `renderCalDayInline` ~10842 / `selectCalDay` ~10859
- カレンダーのスワイプ判定（`#calRail` ガード）: `calSectionWrap` と `VIEW_ORDER` で検索（~5654 付近）
- 完了チェックのCSS: `.item.today-custom.done .check-box` を検索（明:濃オレンジ+白 / mono:黒+白の上書き）

## 9. 描画（キャラ絵）についての結論
**コード生成での手描きキャラ絵は上限が半写実 → 不気味の谷（怖い）か、素朴シンプルのどちらか。** これはエージェントを変えても同じ（Codex でも解決しない）。相棒キャラは **絵は外部調達**（イラストレーター／素材集／画像生成ツール）→ **その絵をコード側で動かす**（口パク/まばたき/表情差分の仕組みは実装済み）という分担が正解。**描画の一点でエージェントを選ばないこと。**

---
最終更新: このメモは Claude セッションからの引き継ぎ（`main` は上記コミット群が反映済み）。

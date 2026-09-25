# Daily Station release checklist

## Release strategy

Ship the web edition first. Android and iOS use the same checked web bundle, but store submission remains a separate gate because signing and platform build environments are intentionally not stored in this repository.

## Before every release candidate

- [ ] Freeze the selected UI and confirm the version with the owner.
- [ ] Update `package.json`, Android `versionName` / `versionCode`, the visible build label, and legal update dates together.
- [ ] Run `pnpm install --frozen-lockfile`.
- [ ] Run `pnpm run release:check`.
- [ ] Open the generated `www/index.html` through a local HTTP server and test Home, Calendar, Task, Routine, Diary, Options, backup export, and backup import.
- [ ] Test at 320 px width and at desktop width in current Chrome, Edge, and Safari/iOS where available.
- [ ] Confirm that a fresh profile starts without console errors and that an existing profile keeps saved data after the update.
- [ ] Confirm the privacy policy and terms match all outbound network requests.
- [ ] Confirm music, fonts, icons, and other third-party notices and keep the source evidence in private release records.
- [ ] Create and test a backup before updating a device that contains important real data.

## Web release gate

- [ ] Choose the canonical public URL and configure GitHub Pages to use GitHub Actions.
- [ ] Choose a private support address. Public GitHub Issues must not receive diaries, locations, or other sensitive information.
- [ ] Decide whether the first public version is an online web app or an offline-capable PWA. The current service worker removes the retired push worker and does not cache the app offline.
- [ ] Run the manual `Deploy Daily Station to GitHub Pages` workflow.
- [ ] Verify the published URL, legal pages, manifest, install icon, weather permission flow, and cache/update behavior.
- [ ] Record the deployed commit SHA and published URL.

## Android release gate

- [ ] Install the supported JDK and Android SDK, then set `JAVA_HOME`.
- [ ] Run `pnpm run release:check` and `android\\gradlew.bat testDebugUnitTest assembleDebug`.
- [ ] Configure release signing outside Git and build an Android App Bundle.
- [ ] Complete Play Console data safety, content rating, store listing, screenshots, privacy URL, and closed testing.
- [ ] Verify backup/restore, weather permission, status bar, splash screen, and update from the previous signed version on a real device.

## iOS release gate

- [ ] Sync on this repository, then build and archive on a current macOS/Xcode environment.
- [ ] Configure signing outside Git.
- [ ] Complete App Store privacy details, age rating, screenshots, support URL, and TestFlight testing.
- [ ] Verify backup/restore, weather permission, safe areas, status bar, splash screen, and update from the previous signed version on a real device.

## Never automate silently

- Do not publish, change repository visibility, create signing keys, accept store agreements, or submit a store build without the owner's explicit instruction at that step.
- Do not commit secrets, certificates, provisioning profiles, keystores, or private support credentials.

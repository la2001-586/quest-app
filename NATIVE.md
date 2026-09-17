# Daily Station native app

## Current stage

Internal prototype foundation. The existing PWA remains the production path. Android and iOS projects wrap the same checked web assets with Capacitor; no store release, signing identity, or production support commitment has been made.

## Canonical source and generated copies

- Edit the root web files, especially `index.html`. Do not edit `www/` or native asset copies directly.
- `pnpm run build` creates the disposable `www/` bundle.
- `pnpm run native:sync` rebuilds `www/` and copies it into the Android/iOS projects.
- The existing PWA deployment remains sourced from the repository root.

## Local setup

Capacitor 8 requires Node.js 22 or newer.

```powershell
pnpm install --frozen-lockfile
pnpm run verify:native
```

Android development additionally needs Android Studio 2025.2.1 or newer and an Android SDK. Open the generated `android/` directory in Android Studio after `pnpm run native:sync`.

iOS builds require macOS and Xcode 26 or newer. On a Mac, install dependencies, run `pnpm run native:sync`, then open `ios/App/App.xcodeproj`.

## Prototype acceptance scope

- The root PWA and native shells show build `BUILD 0917_SUPPORT_PRIVACY_V425`.
- Web assets copy without omissions and Capacitor sync completes.
- Android debug compilation completes in CI or a configured Android workstation.
- Existing local PWA data does not automatically migrate to the native app origin. Use the app's data export/import flow before switching devices or install types.

## Not yet production-ready

- App Store / Google Play accounts, bundle ownership, signing keys, privacy declarations, store screenshots, and release text are unassigned.
- Native push/local notifications are not integrated. The former experimental remote push path is retired; alarms require the app to remain open until a reviewed local-notification implementation is added.
- Physical-device checks for storage persistence, audio, location, safe areas, dark mode, rotation lock, background/resume, and notification behavior remain required.
- Backup/restore currently relies on the app's manual data export/import. No automatic cloud backup commitment exists.
- Manual fallback: continue using the existing PWA if a native build fails.

## Release ownership checklist

| Item | Owner | State / release condition |
| --- | --- | --- |
| Source, web build, and rollback bundle | Repository owner | Confirmed for V425 |
| Android signing key and Play Console account | Business operator | Unassigned; blocks Play release |
| iOS certificates and App Store Connect account | Business operator | Unassigned; blocks App Store release |
| Privacy answers, age rating, screenshots, and store copy | Business operator | Decision required before submission |
| Public support contact | Business operator | Temporary GitHub Issues route; dedicated support email required before store release |
| Crash reporting and support response window | Business operator | Not selected; required before a supervised pilot |
| Data recovery | User | Manual export/import verified in V425; no cloud recovery |
| Failed native build fallback | User | Continue with the existing PWA |

## Versioning and rollback

Root UI changes must keep bumping the visible build tag. Native release versions must be bumped separately in Android/iOS before a signed release. Git tags remain the rollback point for the whole source tree.

# Daily Station

Daily Station brings routines, tasks, plans, and journals into one personal space, connecting record, reflection, and the next action. The web app and the Capacitor Android/iOS shells use the same checked web assets.

The in-app **About & Tutorial** introduces the core workflow, explains the intended role of each feature, and labels the strength and limits of its supporting evidence. It is available at any time from Options → How to Use / Support.

## Development

Requirements: Node.js 22 or newer and pnpm 11.

```powershell
pnpm install --frozen-lockfile
pnpm run verify:native
```

- Edit the root web sources. `www/` and the native public asset folders are generated.
- `pnpm run build` creates the web bundle.
- `pnpm run native:sync` copies the checked bundle into Android and iOS.
- Android and iOS release signing is intentionally kept outside this repository.

## Data and privacy

User-created tasks, diary entries, photos, and settings are stored locally on the device. Weather is optional and sends the location selected by the user to the weather and reverse-geocoding providers described in the [privacy policy](privacy.html).

## Evidence and limitations

The [feature evidence register](evidence.html) maps every current feature to peer-reviewed research, grades how directly the research applies, and states where Daily Station makes no efficacy claim. Daily Station itself has not yet been evaluated in a randomized controlled trial.

## Support

Temporary public support: [GitHub Issues](https://github.com/la2001-586/quest-app/issues). Do not post private or sensitive information. A dedicated support email will replace this route before store release.

## Rights and third-party material

The application source is not offered under an open-source license. See [LICENSE.md](LICENSE.md) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

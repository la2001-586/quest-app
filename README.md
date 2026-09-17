# Daily Station

Daily Station is a personal routine, task, calendar, diary, alarm, and memo app. The web app and the Capacitor Android/iOS shells use the same checked web assets.

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

## Support

Temporary public support: [GitHub Issues](https://github.com/la2001-586/quest-app/issues). Do not post private or sensitive information. A dedicated support email will replace this route before store release.

## Rights and third-party material

The application source is not offered under an open-source license. See [LICENSE.md](LICENSE.md) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

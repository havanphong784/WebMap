# Aether Android release runbook

## One-time setup

1. Register Android app `com.aether.geo` in the existing Firebase project.
2. Add SHA-1 and SHA-256 fingerprints for every debug and release signing key used by the team. Obtain them with `keytool -list -v -keystore <path> -alias <alias>`.
3. Download Firebase's `google-services.json` to `frontend/android/app/google-services.json`. The file is intentionally ignored by Git.
4. Copy `frontend/.env.android.example` to `frontend/.env.android` and replace every placeholder with the production API, Firebase, and Goong values.
5. Configure the backend with `CAPACITOR_ORIGINS=https://localhost`. Keep the public web origins in `CORS_ORIGINS`.
6. Copy `frontend/android/keystore.properties.example` to `frontend/android/keystore.properties`, use an absolute keystore path, and fill all four values. Store the keystore and passwords in the team's secret manager.

## Build and upload

1. Increment `versionCode` and update `versionName` in `frontend/android/app/build.gradle`.
2. From `frontend`, run `npm ci`, `npm run lint`, `npm test -- --run`, and `npm run build:android:web`.
3. Run `npx cap sync android`.
4. From `backend`, run `npm ci` and `npm test`.
5. From `frontend/android`, run `./gradlew clean testDebugUnitTest lintDebug assembleDebug bundleRelease`.
6. Confirm the signed artifact exists at `frontend/android/app/build/outputs/bundle/release/app-release.aab`.
7. Upload the AAB to an internal Play Console track first. Confirm Google Play App Signing, release notes, data safety, content rating, target audience, and store listing before promoting it.

`bundleRelease` and `assembleRelease` deliberately fail when `keystore.properties` is absent or incomplete. Never upload an AAB signed with a temporary or debug key.

## Physical-device release matrix

Record the device/Android version and mark each row PASS only after testing the exact release candidate. Test at least Android 8 (API 26), one current Android version, a small/notched phone, and a tablet or large-screen device when available.

| Check | Device / Android | Result | Notes |
|---|---|---|---|
| Fresh install and cold launch | | PENDING | Splash exits; no blank screen |
| Email registration/login/logout | | PENDING | Session persists after relaunch |
| Google login | | PENDING | Uses native account picker and Firebase session |
| Location permission granted | | PENDING | Current position and nearby content load |
| Location permission denied | | PENDING | Clear recovery message; app remains usable |
| GPS disabled/unavailable | | PENDING | Clear recovery path; no crash |
| Map pan, pinch, rotate, markers | | PENDING | Gestures remain smooth |
| Photo picker and upload | | PENDING | Camera/gallery media uploads successfully |
| Share, copy link, open map | | PENDING | Native actions use valid HTTPS links |
| SSE background/resume | | PENDING | Stream reconnects without duplicate events |
| Rotation and process recreation | | PENDING | Route/session state recovers |
| Offline then reconnect | | PENDING | Error is actionable and retry succeeds |
| Status/navigation safe areas | | PENDING | Content is never obscured |
| Back navigation | | PENDING | Overlays close first; two back presses exit at root |

For a debug smoke test, enable USB debugging, connect one authorized device, verify it appears in `adb devices`, then run `./gradlew installDebug`. Production approval still requires testing the signed Play-distributed build from the internal track.

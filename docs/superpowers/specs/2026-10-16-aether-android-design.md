# Aether Android App Design

## Intent

Ship the existing Aether React/Vite experience as a production-ready Android application without maintaining a second UI codebase. The Android app should feel native at the operating-system boundaries while preserving the web product's map, discovery, profile, notifications, social, chatbot, and location-sharing behavior.

## Goals

- Produce a signed Android App Bundle from the existing frontend.
- Keep web and Android on the same React feature code.
- Support Firebase email/password and Google sign-in on Android.
- Make location permission, live location, image selection, sharing, clipboard, external navigation, system bars, and Android Back behavior reliable.
- Connect only to the deployed HTTPS API and existing hosted map/Firebase services in release builds.
- Add automated checks for platform adapters and a repeatable Android build workflow.

## Non-goals

- Rewriting the UI in Kotlin, Flutter, or React Native.
- Offline maps or offline-first data synchronization.
- Background location tracking.
- Push notifications; the foreground SSE notification stream remains unchanged.
- Tablet-specific layouts, Play Billing, or an iOS build.
- Replacing the backend or database.

## Architecture

Use Capacitor as the Android shell around the Vite build. React remains the source of truth for navigation and screens. Browser/native differences live behind small adapters under `frontend/src/platform`; components do not import Capacitor plugins directly.

The native shell serves the bundled `frontend/dist` assets. Debug and release builds receive `VITE_API_BASE_URL` and Firebase/Goong values at Vite build time. Release configuration must reject localhost and non-HTTPS API URLs. The backend accepts the configured Capacitor origin separately from browser origins.

Firebase email/password continues through the Firebase Web SDK. Google sign-in uses native Android Google authentication, then exchanges its ID token for a Firebase Web SDK credential so the existing auth state and backend Bearer-token flow remain unchanged.

## Product Behavior

- First location use explains why Aether needs location, requests precise location, and degrades gracefully when denied.
- Android Back closes the active overlay/modal first, then follows React history, then requires a second press within two seconds to exit from a root tab.
- System status/navigation bars match the light Aether theme and content respects display cutouts and safe-area insets.
- Share, clipboard, and external-map actions use native capabilities on Android and retain browser fallbacks on web.
- Uploading a location photo continues to use the Android system picker through the existing file input.
- When the app resumes, current auth and foreground SSE behavior reconnect naturally; no background connection is promised.

## Configuration and Security

- Android application id: `com.aether.geo`; display name: `Aether Geo`.
- Capacitor major: 8.x. Minimum Android SDK: 26. Compile and target SDK: 36. Build host: Node.js 22+ and Android Studio 2025.2.1+.
- `google-services.json`, keystores, passwords, `.env.android*`, and generated signing properties are never committed.
- `frontend/.env.android.example` documents every required public build-time value without secrets.
- Cleartext traffic is disabled for release builds.
- Release builds fail before bundling if the API URL is missing, uses localhost, or is not HTTPS.

## Quality Bar

- Frontend unit tests cover browser and native branches of every platform adapter.
- Backend tests cover allowed browser origin, allowed Capacitor origin, absent origin, and rejected origin.
- `npm run lint`, frontend tests, frontend production build, backend tests, and Android Gradle tests/build all pass.
- A physical-device checklist verifies authentication, permission denial/retry, GPS, map gestures, image upload, sharing, external navigation, SSE reconnect after resume, and Back behavior.

## Assumptions Chosen Without Discovery

- Capacitor is preferred over a native rewrite to minimize divergence and delivery time.
- Android is phone-first and portrait/landscape both remain supported.
- Existing deployed Firebase, Goong, storage, and backend services will be reused.
- Play Store submission metadata and screenshots are operational follow-up work; the plan produces the uploadable AAB.

# BloodDono Mobile

A React Native app for connecting blood donors with nearby donation requests. Donors browse requests sorted by proximity, post their own, and search for compatible donors by blood group and location. Each request shows a live hospital map with the distance from wherever the donor is standing.

There's also a [web version](https://blooddono-two.vercel.app/) on the same Supabase backend, so the data lines up across both.

## Highlights

- 🔔 Push notifications for new compatible requests in your governorate
- 📍 Location-aware sorting, so nearby requests rise to the top automatically
- 🩸 Blood compatibility matching, not exact-type matching (O- donors see A+, B+, AB+ requests)
- 🗺️ Interactive hospital maps with live distance, built on Leaflet + OpenStreetMap (no API key needed)
- 🤖 AI eligibility assistant powered by Groq (Llama 3.1), personalized to your blood group and city
- 🌐 Full Arabic + English support with RTL layout that mirrors automatically on switch
- 🌙 Dark and light mode, persisted across sessions

## Download

[**Download APK (v1.0.0)**](https://github.com/amrogad/blooddono-mobile/releases/download/v1.0.0/app-release.apk). Sideload on any Android device (enable "Install unknown apps" in settings).

## Demo accounts

The login screen has one-tap demo logins, no signup needed:

| Role | Email | Password |
|---|---|---|
| Donor | `donor@blooddono.demo` | `Demo123!` |
| Volunteer | `volunteer@blooddono.demo` | `Demo123!` |
| Admin | `admin@blooddono.demo` | `Demo123!` |

## Demo walkthrough

Under 3 minutes to see the core loop:

1. Log in with the Donor demo account.
2. Browse the requests feed. Your O+ matches are filtered by default and sorted nearest first.
3. Open a request to see the hospital on the map and the kilometer distance from you.
4. Switch to the Create tab and post a new request (3-step wizard).
5. Go to Find Donors, pick a blood group and governorate, and see compatible donors.
6. Open the Assistant tab and ask "I had surgery last month, can I donate?" It replies in whichever language the app is set to.
7. Switch to the Volunteer or Admin demo account to see the coordinator and admin views.

## Features

- Browse pending requests sorted by proximity to the donor's governorate and city, with "near you" badges and urgency sections (Critical, Urgent, Planned)
- Blood compatibility matching, so searching for A+ donors also surfaces O+ and O- donors who can safely donate
- Post a request in 3 steps: patient details, hospital location, blood group and date
- Interactive Leaflet map on each request showing the hospital pin, the donor's live position, and the straight-line distance between them
- Accept a request as a donor, which moves it from pending to in-progress
- Find compatible donors by patient blood group and location
- AI eligibility assistant for questions like "I take blood pressure medication, am I eligible?" Answers use your blood group and city, and it replies in the active language
- Push notifications when a new request needs a compatible blood type in your governorate
- Arabic and English with automatic RTL layout mirroring, switchable without leaving the app
- Dark and light themes, persisted with AsyncStorage
- Real profile with blood group, role badge, and location
- Persistent sessions, so you stay signed in across restarts

## Screenshots

| EN · Light | AR · Dark |
|---|---|
| <img src="screenshots/requests.png" alt="Requests feed in English light mode" width="390" /> | <img src="screenshots/requests-ar.png" alt="Requests feed in Arabic dark mode RTL" width="390" /> |

| Request detail | Fullscreen map |
|---|---|
| <img src="screenshots/request-detail.png" alt="Request detail with hospital map" width="390" /> | <img src="screenshots/map.png" alt="Fullscreen map with blood-drop pin" width="390" /> |

| AI assistant · EN | AI assistant · AR |
|---|---|
| <img src="screenshots/assistant.png" alt="Eligibility assistant in English" width="390" /> | <img src="screenshots/assistant-ar.png" alt="Eligibility assistant in Arabic" width="390" /> |

| Find donors | Profile |
|---|---|
| <img src="screenshots/donors.png" alt="Compatible donor search" width="390" /> | <img src="screenshots/profile.png" alt="Profile with dark mode and language toggles" width="390" /> |

| Login | |
|---|---|
| <img src="screenshots/login.png" alt="Login screen with demo roles in Arabic" width="390" /> |

## Architecture

```
Screens (expo-router)
        ↓
TanStack Query  ·  React Context (auth + theme + locale)
        ↓
Service layer (Supabase RPCs, Nominatim, Edge Functions)
        ↓
Supabase (PostgreSQL · Auth · Storage · Edge Functions)
        ↓
Groq (Llama 3.1) · Expo push notifications
```

## Built with

- 13 screens across 3 route groups
- 6 shared components (BloodRoundel, RequestCard, Pills, Avatar, SkeletonCard, BrandHeader)
- 96 automated tests
- Shared Supabase backend with the web version

## Tech stack

### App
- React Native · Expo SDK 56 · TypeScript
- expo-router (file-based navigation, route groups for auth/tabs)
- TanStack Query (server state, caching, background refetch, skeleton loaders)
- React Context (auth session, theme, locale)
- Leaflet in a WebView with OpenStreetMap tiles (no maps API key required)
- expo-location for live position
- Nominatim (OpenStreetMap) for hospital geocoding
- react-i18next for Arabic/English with I18nManager RTL integration
- @expo-google-fonts/cairo + @expo-google-fonts/bricolage-grotesque

### Backend
- [Supabase](https://supabase.com/) for hosted auth, PostgreSQL, RPCs, and storage
- Supabase Edge Functions (Deno) for push notification fan-out and the eligibility assistant
- [Groq](https://groq.com/) (Llama 3.1 8B Instant) for the assistant, called server-side on the free tier
- Expo push notifications

## Testing

```bash
npm test -- --runInBand
```

96 tests across:

- Supabase service wrappers (donations, profiles, geocoding, assistant)
- Auth provider bootstrap
- Login screen
- Pure utilities: haversine distance, proximity sorting, blood compatibility, form validation, error mapping
- i18n key parity (every EN key has an AR translation)

## Why I built this

Blood shortages are a logistics problem: patients need specific types, donors are willing, but there's no fast way to connect the two. BloodDono is that connection. I wanted to build something real end to end instead of a toy demo, so it has live maps, push notifications, an AI feature, and a bilingual RTL interface.

## Getting started

Node LTS, a Supabase project, and either an Android emulator or the Expo Go app on a physical device.

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Start Metro:

```bash
npx expo start
```

Press `a` for Android or scan the QR code in Expo Go. No maps API key needed, since Leaflet uses OpenStreetMap tiles.

## Project structure

```
src/
├── app/
│   ├── (auth)/         login screen
│   ├── (tabs)/         requests, create, donors, assistant, profile
│   ├── request/[id]    request detail + inline map
│   ├── edit-request/   edit an existing request
│   ├── my-requests     requests posted by the current user
│   ├── profile-edit    edit name, blood group, location
│   ├── map             fullscreen hospital map
│   └── funds/          community fund + payment
├── components/         BloodRoundel, RequestCard, Pills, Avatar, SkeletonCard, BrandHeader
├── providers/          AuthProvider, ThemeProvider, LocaleProvider
├── services/           Supabase RPCs, geocoder, assistant Edge Function
├── hooks/              useProfile, useLocation, usePushNotifications
├── i18n/               en.json + ar.json, i18next singleton
├── utils/              distance, proximity sort, blood compatibility, validation, errors, mapHtml
├── constants/          theme tokens (colors, fonts, spacing, shadows)
└── data/               governorates + cities
```

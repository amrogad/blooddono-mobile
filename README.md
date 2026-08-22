# BloodDono Mobile

A React Native app that connects blood donors with nearby patients who need them. Donors browse requests sorted by how close the hospital is, see each one on a live map with the distance from wherever they're standing, and get a push notification when a compatible request appears in their governorate. English and Arabic, with the layout mirroring to full RTL.

[Download APK](https://github.com/amrogad/blooddono-mobile/releases/download/v1.0.0/app-release.apk) · [Web version](https://github.com/amrogad/blooddono) · [Live demo](https://blooddono-two.vercel.app/)

## Why I built this

When someone needs blood, families end up posting in group chats and hoping the right person sees it in time. On a phone the problem becomes one of proximity: you want the requests you could actually reach today, not a list sorted by date. So the mobile version is built around location and notifications, where the web version is built around search.

## Highlights

- Location-aware sorting, so the requests you could reach soonest rise to the top
- Push notifications when a request needs a compatible type in your governorate
- Interactive hospital maps with live distance, on Leaflet and OpenStreetMap, no maps API key needed
- An AI eligibility assistant that queries the donor database through tool calling, and can draft a request for you to confirm
- Shares one Supabase backend and the same edge functions with the web app, so the data lines up across both

## Demo

One-tap demo logins on the login screen, no signup needed:

| Role | Email | Password |
|---|---|---|
| Donor | `donor@blooddono.demo` | `Demo123!` |
| Volunteer | `volunteer@blooddono.demo` | `Demo123!` |
| Admin | `admin@blooddono.demo` | `Demo123!` |

Under 3 minutes to see the core loop:

1. Log in with the Donor demo account.
2. Browse the requests feed. Your O+ matches are filtered by default and sorted nearest first.
3. Open a request to see the hospital on the map and the distance from you in kilometres.
4. Post a new request from the Create tab, in 3 steps.
5. Go to Find Donors, pick a blood group and governorate, and see compatible donors.
6. Open the Assistant tab and ask "I had surgery last month, can I donate?" It replies in whichever language the app is set to.
7. Switch to the Volunteer or Admin demo account for the coordinator and admin views.

## Screenshots

| Requests feed | Request detail with map |
|---|---|
| <img src="screenshots/requests.png" alt="Requests feed in English light mode" width="390" /> | <img src="screenshots/request-detail.png" alt="Request detail with hospital map" width="390" /> |

| AI assistant | Arabic · dark · RTL |
|---|---|
| <img src="screenshots/assistant.png" alt="Eligibility assistant in English" width="390" /> | <img src="screenshots/requests-ar.png" alt="Requests feed in Arabic dark mode, right to left" width="390" /> |

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
Groq (tool calling back into the donor table) · Expo push notifications
```

## Engineering

[![CI](https://github.com/amrogad/blooddono-mobile/actions/workflows/ci.yml/badge.svg)](https://github.com/amrogad/blooddono-mobile/actions/workflows/ci.yml)

- Requests sorted by haversine distance from the donor's live position, falling back to governorate and city when location permission is denied
- Two database-backed AI tool calls: for availability questions the model runs a real query against the donor table rather than guessing a number, and for posting it returns a validated draft that only a human confirmation turns into a row
- Hospital and donor rendered on a Leaflet map inside a WebView, so there's no maps API key and no billing account
- 169 automated tests covering service wrappers, auth bootstrap, the assistant's tool layer, the draft confirmation card, pure utilities like haversine distance and blood compatibility, and a parity check that every English string has an Arabic translation
- Lint, TypeScript and the full Jest suite on every push through GitHub Actions, with no repository secrets needed, so a fork's CI goes green without any setup
- Arabic and RTL from one component tree, wired into React Native's `I18nManager` so mirroring is a direction change rather than a second set of styles

### How the assistant works

The assistant uses Groq function calling through a Supabase Edge Function. It can query real donor availability using blood-type compatibility and city, while only sending aggregated counts to the model — never donor names or photos.

It can also turn a conversation into a **validated donation request draft**. The assistant never submits it: you review the details and confirm it in the app, where the final insert runs under your normal permissions.

### How it's tested

The assistant has a separate 24-case eval covering tool usage, blood-type compatibility, safety responses, and request drafting. An initial 40% score exposed a real compatibility mistake, so I moved the compatibility rules out of the model's memory and into the same source of truth used by the app.

## Known limitations

- The assistant drafts a request but can't submit one, and it can't accept a request for you at all. Accepting commits you to showing up somewhere, which needs more than a confirmation card.
- The draft card is read-only. Fixing a typo means telling the assistant, or opening the draft in the full form.
- It never sees donor identities, so it can tell you how many people could help but not who. Find Donors does that part.
- Distribution is a sideloaded APK. There's no Play Store listing or internal testing track yet.
- iOS is untested. It's an Expo app and should run, but it has only been exercised on Android.
- New requests need a pull-to-refresh. Supabase Realtime is the obvious fix and isn't wired up.
- The eval set avoids questions whose correct answer varies by country, like exact tattoo or travel deferral periods, so answers there are unverified.

## Getting started

Node LTS, a Supabase project, and either an Android emulator or Expo Go on a device.

```bash
npm install
cp .env.example .env   # add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
npx expo start         # press a for Android, or scan the QR in Expo Go
```

```bash
npm test -- --runInBand   # 169 tests
npm run eval              # 24 assistant eval cases, makes real API calls
```

## Tech stack

App: React Native, Expo SDK 56, TypeScript, expo-router, TanStack Query, React Context, react-i18next with `I18nManager`.

Maps and location: Leaflet in a WebView with OpenStreetMap tiles, expo-location, Nominatim for geocoding.

Backend, as a managed service: Supabase for hosted auth, PostgreSQL, RPCs and storage, Supabase Edge Functions (Deno) for push fan-out and the assistant, Groq (`openai/gpt-oss-20b`) called server-side so the key never ships in the app, and Expo push notifications.

Testing: Jest, React Native Testing Library.

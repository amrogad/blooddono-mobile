# BloodDono Mobile

A React Native app for connecting blood donors with nearby requests, built with Expo, TypeScript, and Supabase.

Donors browse blood donation requests near them, post their own, and search for compatible donors by blood group and location. Each request detail shows a map with the hospital pinned and the distance from the donor's current location.

There's also a [web version](https://blooddono-two.vercel.app/) that shares the same Supabase backend.

## Try it yourself

The login screen has one-click Demo logins for all three roles, no signup needed:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@blooddono.demo` | `Demo123!` |
| Donor | `donor@blooddono.demo` | `Demo123!` |
| Volunteer | `volunteer@blooddono.demo` | `Demo123!` |

## Features

- Browse pending requests, sorted by proximity to the donor's governorate and city (with an "In your area" badge)
- Post a donation request with recipient details, hospital, address, blood group, and time
- Open a request to see the hospital on an OpenStreetMap map, your live position, and the kilometer distance between them
- Accept a request as a donor, which moves it from pending to inprogress
- Search for compatible donors by patient blood group and location (matches by blood-type compatibility, not exact type)
- Ask an eligibility assistant questions like "I got a tattoo two weeks ago, can I donate?" and get answers personalized to your blood group and city
- Get a push notification when a new request needs a compatible blood type in your governorate
- Real profile screen with role, blood group, and location
- Persistent sessions with AsyncStorage, so you stay signed in across restarts
- Pull-to-refresh on the requests list

## Screenshots

| Login | Requests |
|---|---|
| ![Login with demo accounts](screenshots/login.png) | ![Requests list sorted by proximity](screenshots/requests.png) |

| Request detail | Fullscreen map |
|---|---|
| ![Request detail with hospital map and distance](screenshots/request-detail.png) | ![Fullscreen map with route to the hospital](screenshots/map.png) |

| Eligibility assistant | Create request |
|---|---|
| ![AI eligibility assistant chat](screenshots/assistant.png) | ![Create request form](screenshots/create.png) |

| Find donors | Profile |
|---|---|
| ![Compatible donor search](screenshots/donors.png) | ![Profile with role and blood group](screenshots/profile.png) |

## Tech stack

### App
- React Native and Expo (SDK 56)
- TypeScript
- expo-router (file-based navigation)
- TanStack Query (server state, caching, refetch)
- React Context (auth session)
- Leaflet in a WebView with OpenStreetMap tiles
- expo-location for the user's current position
- Nominatim (OpenStreetMap) for hospital geocoding
- expo-linear-gradient, @expo-google-fonts/inter

### Backend (managed service)
- [Supabase](https://supabase.com/) for hosted authentication, database, and RPCs
- Supabase Edge Functions (Deno) for push notification fan-out and the eligibility assistant
- Groq (Llama 3.1) for the assistant, called server-side from the Edge Function
- Expo push notifications

### Testing
- Jest with jest-expo
- React Native Testing Library

## Getting started

You'll need Node LTS, a Supabase project, and either an Android emulator or the Expo Go app on a physical device.

```bash
npm install
cp .env.example .env
```

Fill in `.env` with your Supabase URL and anon key:

```
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Start Metro and open the app:

```bash
npx expo start
```

Press `a` for Android, or scan the QR code in Expo Go.

The map uses Leaflet with OpenStreetMap tiles rendered in a WebView, so there's no maps API key to set up.

## Testing

```bash
npm test
```

71 tests across the Supabase service wrappers (auth, donations, profiles, geocoding, assistant), the auth provider bootstrap, the login screen, and the pure utilities (distance, proximity sorting, form validation, error mapping).

## Project structure

Everything lives under `src/`:

- `src/app/` – expo-router routes, grouped as `(auth)` for the login and `(tabs)` for the main app
- `src/services/` – thin wrappers over Supabase RPCs, the Supabase client, the Nominatim geocoder, and the eligibility assistant Edge Function
- `src/providers/AuthProvider.tsx` – session context and auth bootstrap
- `src/hooks/` – `useProfile`, `useLocation`, `usePushNotifications`
- `src/components/` – shared UI like the brand header and skeleton loader
- `src/constants/` – `theme` (colors/spacing/type) and the demo accounts
- `src/utils/` – `distance` (haversine km), `proximity` (request sorting), `validation`, `errors`, and `mapHtml` (the Leaflet map document)
- `src/data/` – governorate and city data

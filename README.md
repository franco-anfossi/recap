# recap.

A daily journal built around intentions. One honest check-in a day, tagged to the intentions it moved and the life areas it fed, a calendar that shows the shape of your weeks, insights built from real entries, and a year-end recap.

## The four burners

Health, work, family, friends. You can't keep all four on high. Every intention feeds one burner, every check-in records where the energy went, and you can declare the burner you are deliberately turning down this season. Insights and the yearly recap read your days against that choice.

Built with Expo Router, React Native, Zustand and Supabase.

## Run it

```bash
npm install
cp .env.example .env   # add your Supabase URL + anon key
npx expo start
```

Press `i` for the iOS simulator, `a` for Android, `w` for web.

## Design system

Everything visual comes from `constants/theme.ts` (colors, spacing, radius, type ramp, shadows, motion) and `constants/moods.ts` (the five mood colors). Screens compose the primitives in `components/ui` (`Button`, `Input`, `Card`, `Screen`, `ScreenHeader`, `ModalHeader`, `Chip`, `Segmented`, `StatTile`, `ListRow`, `EmptyState`, `Wordmark`) and the signature `MoodFace` glyph in `components/mood`.

- Headlines: Fraunces (serif). Body and UI: DM Sans.
- Brand: ember orange on warm paper. Moods run brick → coral → amber → olive → jade.
- Light-only UI (`userInterfaceStyle: light`).

## Localization

English and Spanish, picked from the device language (`lib/i18n.ts`, dictionaries in `locales/`). Dates go through `lib/dates.ts`. In a browser you can force a language with `localStorage.setItem('recap-locale', 'es')` (dev only).

## Flow

1. `app/(auth)/welcome.tsx` — first-launch intro (shown once per device).
2. `app/(auth)/login.tsx`, `register.tsx`.
3. `app/setup.tsx` — after sign-up: name, first check-in, one intention (with its burner), which burner is turned down.
4. `app/(tabs)` — Today, Calendar, Insights, Friends, You.
5. `app/entry/*`, `app/summary/[year].tsx`, `app/legal/[doc]` — modals.
6. `app/(auth)/reset-password.tsx` — reached from the recovery email link (`recap://reset-password`; add it to the Supabase redirect allow-list).

Routing between these lives in `app/_layout.tsx`; onboarding state is persisted in `stores/onboarding.store.ts`.

## Database

Migrations live in `supabase/migrations`. `delete_own_account()` is the RPC behind "Delete account". `supabase/seeds/seed.sql` creates `seed_test_*@recap.app` accounts (password `password123`) for local testing.

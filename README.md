# recap.

A daily mood journal. One honest check-in a day, a calendar that shows the shape of your weeks, insights built from real entries, and a year-end recap.

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

## Flow

1. `app/(auth)/welcome.tsx` — first-launch intro (shown once per device).
2. `app/(auth)/login.tsx`, `register.tsx`.
3. `app/setup.tsx` — after sign-up: name, first check-in, one intention.
4. `app/(tabs)` — Today, Calendar, Insights, Friends, You.
5. `app/entry/*`, `app/summary/[year].tsx` — modals.

Routing between these lives in `app/_layout.tsx`; onboarding state is persisted in `stores/onboarding.store.ts`.

## Database

Migrations live in `supabase/migrations`. `supabase/seeds/seed.sql` creates `seed_test_*@recap.app` accounts (password `password123`) for local testing.

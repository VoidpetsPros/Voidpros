# voidpros — setup

## 1. Set up Supabase

1. Go to [supabase.com](https://supabase.com), sign up, and create a new project.
2. Once it's provisioned, open the **SQL Editor** in the left sidebar.
3. Run each file in `supabase/migrations/` **in order** — paste the contents
   of `0001_initial_schema.sql` into a new query, run it, then do the same
   for `0002_seed_data.sql`, then `0003_storage.sql`.
4. Go to **Project Settings → API**. Copy the **Project URL** and the
   **anon public** key.

## 2. Configure the app

```bash
cp .env.example .env.local
```

Paste your Project URL and anon key into `.env.local`.

## 3. Run it locally

```bash
npm install
npm run dev
```

Open the local URL it prints. Try creating an account, then go to
"My collection" and add a few pets/items — refresh the page and they'll
still be there, since it's now a real database instead of browser memory.

**Note on email confirmation:** by default Supabase requires email
confirmation before a new account can sign in. For faster testing, go to
**Authentication → Providers → Email** in the Supabase dashboard and turn
off "Confirm email" — just remember to turn it back on before a real launch.

## 4. Deploy to Vercel

1. Push this project to a GitHub repo.
2. Go to [vercel.com](https://vercel.com) → New Project → import the repo.
3. In the project's Environment Variables settings, add `VITE_SUPABASE_URL`
   and `VITE_SUPABASE_ANON_KEY` with the same values from your `.env.local`.
4. Deploy.

## What's actually wired up right now

- Real signup/login/logout (email+password and Google OAuth, if you enable
  the Google provider in Supabase's Auth settings)
- A real `profiles` row per user (karma, subscription status, trial usage —
  ready for later features)
- A real collection page: owned pets (toggle) and owned items (counted),
  persisted to Postgres, not browser state

## What's not built yet (next steps)

- Floor search + build matching against the real database
- Build submission (the 4-pet team builder + image upload to Supabase Storage)
- Voting, comments, confirmations
- Requests / fulfillment flow
- Stripe subscription billing
- The visual polish and copy from the earlier mockup — this pass prioritized
  wiring real data over matching that design exactly. Once the data layer is
  solid, porting the mockup's styling over is straightforward.

Tell me which of these to build next and I'll keep going.

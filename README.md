# DockWarrior 🛡️

> Know the dock before you roll in.

Crowdsourced dock intelligence for truck drivers — wait times, detention pay history, lumper fees, and driver respect scores. Built by drivers, for drivers.

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
Copy `.env.example` to `.env` and fill in your keys:
```bash
cp .env.example .env
```

```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_GOOGLE_PLACES_KEY=your-google-places-api-key
```

### 3. Set up Supabase database
1. Go to your Supabase project → SQL Editor
2. Copy and run all the SQL from `src/lib/supabase.js` (the commented block)
3. Create a storage bucket called `review-photos` (set to public)

### 4. Run locally
```bash
npm start
```

---

## Deploy to Vercel

1. Push this folder to a GitHub repo
2. Go to vercel.com → New Project → Import your repo
3. Add environment variables in Vercel dashboard (same 3 keys)
4. Deploy — it's live in ~2 minutes

---

## Features (MVP)

- 🔍 **Facility Search** — Search any dock by name, city, or state with Google Places autocomplete
- ⭐ **Driver Reviews** — Overall rating, wait time, detention pay, lumper fees, bathroom access, driver respect
- 📸 **Photo Upload** — Attach photos to reviews (stored in Supabase)
- ⏱️ **Detention Timer** — One-tap timer with free time countdown and automatic detention tracking
- 📄 **Detention Reports** — Download a text report with all timestamps for broker disputes
- 👤 **Driver Profiles** — Review history, detention log history, achievement badges
- 🔐 **Auth** — Supabase email auth with driver accounts

---

## Supabase Storage Setup

1. Go to Storage in your Supabase dashboard
2. Create a new bucket called `review-photos`
3. Set it to **Public**
4. Add this policy: Allow authenticated users to upload

---

## Tech Stack

- React 18
- React Router v6
- Supabase (auth, database, storage)
- Google Places API
- Lucide React (icons)
- React Hot Toast
- Deployed on Vercel

---

## Roadmap

- [ ] Broker payment speed ratings
- [ ] Weekly "Worst Docks" leaderboard
- [ ] Push notifications for route alerts
- [ ] Detention invoice PDF generator
- [ ] Safety check-in feature
- [ ] Expo mobile app (iOS + Android)
- [ ] AI-powered load rate analyzer

---

Built with DockWarrior — dockwarrior.com

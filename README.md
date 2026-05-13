# Cosmic Identity

A personal profile tool that combines five frameworks into one unified portrait:

1. **Western Astrology** (Sun sign, plus full natal chart with optional API key)
2. **Chinese Zodiac** (animal + element, calculated from real Chinese New Year dates)
3. **Numerology** (Life Path Number, master numbers preserved)
4. **Human Design** (self-selected type)
5. **MBTI** (16 personalities, optional)

It also offers:

- **Compatibility mode** to compare two people across 5 life areas
- **Share / export** with PDF download, email share, and copy summary
- **Animated galaxy background** with drifting nebulae, twinkling stars, and occasional shooting stars

## Tech stack

- Vanilla HTML / CSS / JS (no framework)
- [Vite](https://vitejs.dev/) for the local dev server
- Two small Vercel serverless functions that hold API keys server-side and avoid browser CORS issues:
  - `api/synthesis.js` proxies prompts to Claude (Anthropic)
  - `api/human-design.js` proxies birth data to humandesignhub.app for automatic Human Design type detection
- Calls the Astrologer API (via RapidAPI) for full natal chart data directly from the browser. The user enters their own RapidAPI key in the UI.

## Architecture

```
Browser (index.html)
   │
   ├─► /api/synthesis      (Vercel function, holds ANTHROPIC_API_KEY)
   │       │
   │       └─► api.anthropic.com         (Claude Sonnet 4.6 synthesis)
   │
   ├─► /api/human-design   (Vercel function, holds HUMANDESIGN_API_KEY)
   │       │
   │       └─► api.humandesignhub.app    (auto-detect HD type, free 200 req/mo)
   │
   └─► astrologer.p.rapidapi.com         (full natal chart, user key, optional)
```

## Run locally

You have two options.

### Option A: Static frontend only (synthesis disabled)

```bash
npm install
npm run dev
```

This serves the UI on `http://localhost:5173`. Everything renders, but the synthesis text will say "Could not connect to interpretation engine" because `/api/synthesis` only exists when the Vercel runtime is running.

Use this for visual / styling work.

### Option B: Full stack with Vercel CLI (synthesis works)

```bash
npm install -g vercel        # one-time
vercel link                  # one-time, links this folder to a Vercel project
cp .env.example .env.local   # then paste your real ANTHROPIC_API_KEY
vercel dev
```

This serves both the static frontend and the `/api/synthesis` function on `http://localhost:3000`. Synthesis calls work.

## Deploy to Vercel

1. Push the repo to GitHub
2. In Vercel, import the repo. Vercel auto-detects Vite + the `api/` folder
3. In Project Settings → Environment Variables, add:
   - `ANTHROPIC_API_KEY` = `sk-ant-...` (from [console.anthropic.com](https://console.anthropic.com/))
   - `HUMANDESIGN_API_KEY` = your key (from [humandesignhub.app/en/developer](https://humandesignhub.app/en/developer), free tier = 200 requests/month)
4. Deploy

That is it. The function bills against your Anthropic account, so any user can use the synthesis without entering their own key.

## Astrologer API (optional, user-entered)

For the full natal chart (Rising sign, Moon, planets, houses), users can paste a RapidAPI key into the UI. Without it, only the Sun sign is shown. The key is never sent to the server, only to RapidAPI from the browser.

Get a key at [rapidapi.com/gbattaglia/api/astrologer](https://rapidapi.com/gbattaglia/api/astrologer).

## Project structure

```
cosmic-identity/
├── index.html              ← The whole frontend in one file
├── api/
│   ├── synthesis.js        ← Vercel function (Anthropic proxy)
│   └── human-design.js     ← Vercel function (humandesignhub.app proxy)
├── public/
│   └── favicon.svg
├── package.json
├── vite.config.js
├── .env.example            ← Copy to .env.local for local dev
├── .gitignore
└── README.md
```

## Notes on accuracy

- **Sun sign** uses standard Western tropical-zodiac date ranges
- **Chinese Zodiac** uses a hardcoded lookup of Chinese New Year dates from 1924 to 2043, so someone born Jan 15 1990 is correctly a Snake, not a Horse
- **Life Path Number** preserves master numbers 11, 22, and 33
- **Human Design** is auto-detected from birth date, time, and timezone via humandesignhub.app. Falls back to a self-select dropdown if the API errors or birth time is missing
- **Full natal chart** (when API key is provided) uses Placidus houses and the Tropical zodiac, via Astrologer API's Kerykeion / Swiss Ephemeris backend

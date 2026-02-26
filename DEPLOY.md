# Portfolio Tools — Deployment Guide

## What's in here

```
portfolio-tools/
├── netlify.toml              ← Netlify config
├── netlify/functions/
│   └── claude-proxy.mjs      ← Serverless proxy (keeps API key safe, rate limits)
├── public/
│   ├── index.html             ← Landing page (lab.halle.studio or similar)
│   ├── viral-forensics/       ← AI-powered (uses proxy)
│   ├── creator-brief/         ← AI-powered (uses proxy)
│   ├── campaign-concept/      ← AI-powered (uses proxy)
│   ├── reverse-research/      ← AI-powered (uses proxy)
│   ├── command-center/        ← Client-side only (no API)
│   ├── cowgirl-down/          ← Static HTML (no API)
│   └── manosphere/            ← Static HTML (no API) — needs to be added
```

## Deploy to Netlify (5 minutes)

### Step 1: Get the files on GitHub
1. Create a new GitHub repo (e.g., `portfolio-tools`)
2. Push this entire `portfolio-tools/` folder to the repo

### Step 2: Deploy on Netlify
1. Go to [netlify.com](https://netlify.com) and sign in with GitHub
2. Click "Add new site" → "Import an existing project"
3. Select your GitHub repo
4. Build settings should auto-detect from netlify.toml:
   - **Publish directory:** `public`
   - **No build command needed** (everything is pre-built)
5. Click "Deploy site"

### Step 3: Add your API key
1. In Netlify dashboard → Site settings → Environment variables
2. Add: `ANTHROPIC_API_KEY` = your key from [console.anthropic.com](https://console.anthropic.com)
3. Redeploy the site (Deploys → Trigger deploy)

### Step 4: Custom domain (optional)
1. In Netlify → Domain settings → Add custom domain
2. Options:
   - `lab.halle.studio` (subdomain of your main site)
   - `tools.halle.studio`
   - `builds.halle.studio`
3. Add a CNAME record in your DNS pointing to the Netlify URL

## How rate limiting works

The proxy function (`claude-proxy.mjs`) limits each visitor to **10 AI-powered tool uses per day** based on IP address. This is in-memory rate limiting (resets when the serverless function cold-starts, roughly every few hours), which is fine for a portfolio demo.

Estimated monthly cost at 10 uses/day:
- ~300 API calls/month
- ~$0.02/call average
- **~$6/month max** (likely less since most visitors won't use all 10)

## Still needs to be added

- **Manosphere Generator**: The original HTML file needs to be placed in `public/manosphere/index.html`
- **NYC Move HQ**: Already hosted on Lovable, linked externally from the landing page

## Linking from halle.studio

Add a nav item on your main site pointing to wherever this is hosted:
- "Lab" or "Builds" or "Field Notes"
- Link to the landing page (index.html)

## If you want to update a tool later

Just edit the HTML file in `public/[tool-name]/index.html` and push to GitHub. Netlify auto-deploys on every push.

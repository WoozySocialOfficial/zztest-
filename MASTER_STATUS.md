# MASTER_STATUS — CCS Post Studio

_Last updated: 2026-06-03 · Branch: `feat/phase-1-foundation` · Repo: `WoozySocialOfficial/zztest-`_

## TL;DR
Phase-1 foundation + working MVP scaffold is **built and committed**, but **not yet
runnable end-to-end** because the Convex backend isn't provisioned. The access token
provided is a *service account* that can't create a project. I need a **Convex deploy
key** (or you run `npx convex dev` once) to provision, generate types, and verify.

---

## Key decisions made during the build
- **Backend = Convex** (not Supabase). Decided after the existing Supabase org showed
  a $10/mo charge for a second project; you chose Convex. DB + storage + auth +
  functions in one free service. This **supersedes the Supabase parts of CONTEXT.md**.
- **Auth = Convex Auth**, email + password, client-side provider.
- **Next.js pinned to 15** (create-next-app installed 16; Convex Auth 0.0.93 targets
  14/15 and 16 renamed `middleware`→`proxy`). 15 is closest to CONTEXT.md's "Next 14".
- **GitHub** resolved: pushing to `WoozySocialOfficial/zztest-` via your PAT.
- **Higgsfield video = Phase 2** (confirmed).

## What's built ✅
- **Security model:** every Convex function routes through
  `convex/lib/access.ts → requireClientOwnership`. AI keys are server-only (Convex env).
  Only `NEXT_PUBLIC_CONVEX_URL` is ever public. `.env.local` is gitignored.
- **Schema** (`convex/schema.ts`): clients, brandProfiles, galleryItems
  (uploaded|approved — the learning loop), learnRules (design|caption|video),
  generatedDesigns (draft|approved + provider/model/cost). Video tables reserved.
- **Data functions:** `clients`, `brand`, `gallery` (signed uploads), `rules`,
  `designs` (approve → feeds gallery; editable captions) — all ownership-checked.
- **AI layer:** swappable `ai/types.ts` provider interface, `ai/openai.ts`
  (gpt-image-1.5, cost-estimating), `ai/ideogram.ts` stub, `ai/caption.ts` (Anthropic,
  anti-hallucination prompt), `generate.ts` action with **`MOCK_AI` $0 guard** and
  draft/final cheap-tier switching.
- **Frontend (light & bright):** providers, login/signup, auth-gated `/app` shell,
  client sidebar (create/switch/sign-out), **Brand Gallery** (upload + palette learning
  + style notes + scoped rules), **Studio** (generate 3 alternatives, editable captions,
  approve→gallery, download, per-client cost readout, history).

## Not yet done / next layer 🔜
- **Provisioning + end-to-end verification** (blocked — see below). No typecheck/build
  has run yet because `convex/_generated` requires a live deployment.
- **Layered editor (Konva) + PSD/Canva export** for "editable in Photoshop/Canva" —
  deliberately deferred to the next layer so the base runs first.
- Image-to-image using approved gallery refs (currently style is passed as text).
- Phase 2: Higgsfield video (upload recorded clips → edited reels).
- Phase 3: Cloud Campaign scheduling, Canva Connect, Vercel domain (Hostinger).

## ⚠️ What I need from you to make it run
1. **Convex deploy key** — dashboard.convex.dev → create project `ccs-post-studio` →
   Settings → Deploy Keys → Generate (looks like `dev:name-123|eyJ...`). Paste it.
   _Or_ run `npx convex dev` once locally and paste the `NEXT_PUBLIC_CONVEX_URL` +
   `CONVEX_DEPLOYMENT` it writes. (The token you sent is a service account and can't
   create a project.)
2. **`ANTHROPIC_API_KEY`** — for captions (images already have the OpenAI key).
3. After provisioning I will: `npx convex dev` (codegen + push), set Convex env
   (`MOCK_AI=true`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, model vars), then run
   `npx convex run @convex-dev/auth init` style setup for Auth keys, typecheck/build,
   and verify the full loop on mock (zero cost) + one cheap real generation.

## Manual steps you own (later)
- **Vercel:** connect `zztest-` repo, set `NEXT_PUBLIC_CONVEX_URL` env var, deploy preview.
- **Hostinger:** point a chosen domain at the Vercel deployment (Phase 3).
- **Security hygiene:** rotate the keys pasted in chat once we're stable.

## How to run (after provisioning)
```
cd ccs-post-studio
npx convex dev        # one terminal: backend + codegen
npm run dev           # another terminal: Next.js on http://localhost:3000
```

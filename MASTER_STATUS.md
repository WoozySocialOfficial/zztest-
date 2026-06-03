# MASTER_STATUS — CCS Post Studio

_Last updated: 2026-06-03 · Branch: `feat/phase-1-foundation` · Repo: `WoozySocialOfficial/zztest-`_

## TL;DR
Phase-1 foundation + working MVP is **built, deployed, and verified to build/boot**.
Convex backend is live on a **preview** deployment (`ardent-lapwing-470`), all env vars
+ Convex Auth keys are set, `next build` passes (full type-check), and the server serves
`/login` and `/app`. Remaining: a **browser click-through** of the full loop, and a
**production** Convex deployment for real use (preview is fine for testing).

## Live deployment
- Convex (preview): `https://ardent-lapwing-470.eu-west-1.convex.cloud`
  (team `marcell-zaneta`, project `zz-test`). Dashboard via convex.dev.
- Env vars set on it: MOCK_AI=true, IMAGE_PROVIDER=openai, OPENAI_API_KEY,
  ANTHROPIC_API_KEY, DRAFT/FINAL image+caption models, SITE_URL, JWT_PRIVATE_KEY, JWKS.
- Run locally: `npm run dev` (NEXT_PUBLIC_CONVEX_URL already in .env.local).

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

## ✅ Done since first commit
- Provisioned Convex (preview), set all env + Convex Auth keypair, wired
  `NEXT_PUBLIC_CONVEX_URL`. `next build` passes; server serves `/login` + `/app`.
- GitHub push working (write-scoped PAT). Both AI keys stored.

## Remaining
1. **Browser click-through** — sign up, create a client, add gallery/rules, generate
   3 mock options ($0), approve one → confirm it lands in the gallery. I can drive this
   with browser tooling if you want, or you can run `npm run dev` and try it.
2. **Production deployment** — current backend is a *preview* (ephemeral). For real use,
   create a prod deployment + prod deploy key, then re-run the env setup against prod.
3. **Turn off `MOCK_AI`** (set to `false` on the deployment) when you want real images —
   start with `draft: true` (cheap tier) to keep spend tiny.

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

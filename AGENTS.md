# CCS Post Studio — agent & contributor guide

Multi-tenant web app for Creative Crew Studio: on-brand social posts (image +
caption) generated per client, in one bright workspace. Brands must never
cross-contaminate. See `../CONTEXT.md` for the product spec and `MASTER_STATUS.md`
for current build state.

## Stack
- **Next.js 15** (App Router, TypeScript) — pinned to 15 (NOT 16) for Convex Auth
  compatibility. React 19.
- **Convex** — database + serverless functions + file storage + auth (one service).
  Replaces the Supabase plan in CONTEXT.md (decided during build; see MASTER_STATUS).
- **Convex Auth** (`@convex-dev/auth`) — email + password, client-side provider.
- **AI:** OpenAI `gpt-image-1.5` (images) + Anthropic Claude (captions), called only
  inside Convex **actions**. Image provider is swappable via `IMAGE_PROVIDER`.

## Non-negotiable rules
- **Secrets are server-only.** AI keys live in **Convex env** (never Vercel, never
  `NEXT_PUBLIC_*`, never the browser). Only `NEXT_PUBLIC_CONVEX_URL` is public.
- **Tenant isolation** goes through `convex/lib/access.ts → requireClientOwnership`.
  Every client-scoped query/mutation/action MUST call it. No exceptions.
- **No hallucination / no auto-post.** Generations are client-facing: prompts are
  brand-locked and anti-fabrication; everything is a draft until a human approves.
- **`MOCK_AI=true`** (Convex env) returns placeholders so UI work costs $0. Use cheap
  model tiers (`draft: true`) for testing; flagship only for finals.
- Never push to `main`. Work on feature branches.

## Layout
- `convex/` — schema, auth, data functions (`clients/brand/gallery/rules/designs`),
  AI (`ai/`, `generate.ts`). `_generated/` appears after `npx convex dev`.
- `src/app/` — `login/`, `app/` (the studio: `Sidebar`, `StudioTab`, `BrandTab`).
- `src/lib/` — `upload.ts`, `palette.ts`.

## Next.js note
This project is pinned to Next 15. If it is ever upgraded to 16+, note that
`middleware.ts` is renamed to `proxy.ts` and other conventions changed — read
`node_modules/next/dist/docs/` first.

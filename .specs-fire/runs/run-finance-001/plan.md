---
run: run-finance-001
work_item: project-scaffold
intent: family-ledger
mode: confirm
checkpoint: plan
approved_at: "2026-07-22T14:15:00Z"
---

# Implementation Plan: Project scaffold, database, and deployment pipeline

## Approach

Initialize a Next.js 14 (App Router, TypeScript) application at the repo root, with Tailwind CSS, Prisma pointed at a Neon Postgres database, ESLint/Prettier, and Vitest. Wire the repo to Vercel for auto-deploy and prepare it to accept the user's custom domain.

This work item is infrastructure-only — no domain models (households, expenses, etc.) are created yet; those start in `household-member-model`.

**Manual steps required from you** (I cannot create third-party accounts on your behalf):
1. Create a free [Neon](https://neon.tech) project and copy its Postgres connection string.
2. Create a [Vercel](https://vercel.com) account/project and link it to this git repo (via `vercel` CLI login or the Vercel dashboard's "Import Git Repository").
3. Purchase your domain (any registrar) if you haven't already, then add the DNS record Vercel gives you once the project is linked — I'll give you the exact record to add at that point.

I'll do everything else: code scaffold, config, and giving you the exact commands/values to paste for steps 1–3.

## Files to Create

| File | Purpose |
|------|---------|
| `package.json` | Project manifest, scripts (dev/build/test/lint) |
| `tsconfig.json` | TypeScript config |
| `next.config.ts` | Next.js config |
| `tailwind.config.ts` / `postcss.config.js` | Tailwind CSS setup |
| `app/layout.tsx` | Root layout |
| `app/page.tsx` | Placeholder home page |
| `app/globals.css` | Tailwind base styles |
| `prisma/schema.prisma` | Prisma schema (empty baseline — just datasource/generator, no models yet) |
| `lib/db.ts` | Shared Prisma client singleton (per coding standards — no ad hoc `new PrismaClient()`) |
| `.eslintrc.json` | ESLint config (`eslint-config-next` + TypeScript rules) |
| `.prettierrc` | Prettier config |
| `vitest.config.ts` | Vitest config |
| `lib/db.test.ts` | Smoke test verifying the test runner works |
| `.env.example` | Documents required env vars (`DATABASE_URL`, and placeholders for auth vars used later) |
| `.gitignore` | Standard Next.js/Node ignores (`node_modules`, `.next`, `.env*.local`) |

## Files to Modify

| File | Changes |
|------|---------|
| `README.md` | Replace placeholder with real project description + local setup instructions (env vars, `npm install`, `npx prisma migrate dev`, `npm run dev`) |

## Tests

| Test File | Coverage |
|-----------|----------|
| `lib/db.test.ts` | Verifies Vitest runs and the Prisma client module loads without error |

## Technical Details

- Baseline `prisma/schema.prisma` has no models yet — `prisma migrate dev --name init` will create an empty initial migration so later work items add models incrementally.
- `DATABASE_URL` goes in `.env.local` (gitignored) locally, and in Vercel's project environment variables for deployment — never committed.
- Deployment verification for this work item: a successful `vercel` deploy (or push-to-main auto-deploy) serving the placeholder home page over HTTPS at the Vercel-assigned URL. Custom domain attachment is a manual DNS step on your end once the project is linked; I'll confirm it resolves once you've added the record.

---

## Work Item: auth-setup

### Approach

Wire up NextAuth (v4, App Router route handler) with two providers — Google OAuth and Email (magic link) — and gate account creation behind an invite: a user can only complete sign-in if a pending `Invite` record exists matching their email address. No self-serve public signup.

Since `household-member-model` (which defines `Member`, `Household`, and the invite-consumption relationship) hasn't landed yet, this work item creates the minimal `User`/`Account`/`Session`/`VerificationToken` tables NextAuth's Prisma adapter needs, plus a standalone `Invite` model (email + household reference is deferred — for now, invite is scoped to "is this email allowed to sign up at all," since `Household` doesn't exist yet). `household-member-model` will later extend `Invite` with a household reference once that model exists.

Email provider requires an SMTP sender for magic links. Using Gmail SMTP with an App Password for now (zero cost, uses the account you already have); plan to switch to a dedicated transactional provider (e.g. Resend) once a custom domain is attached, since unverified-domain accounts on those providers can only send to your own verified address.

### Files to Create

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` (modify) | Add `User`, `Account`, `Session`, `VerificationToken` (NextAuth adapter tables) and `Invite` (email, consumed timestamp) |
| `lib/db.ts` | Prisma client singleton — reinstated now that real models exist to generate against |
| `lib/invites.ts` | `isInvited`/`consumeInvite` — the actual gating logic, kept separate from NextAuth config so it's directly testable |
| `lib/auth.ts` | NextAuth config: PrismaAdapter, Google provider, Email provider, `signIn` callback wired to `lib/invites.ts` |
| `app/api/auth/[...nextauth]/route.ts` | NextAuth route handler (GET/POST) |
| `app/api/invites/route.ts` | Admin-only endpoint (gated by `ADMIN_EMAIL`) to create an invite |
| `app/invite/page.tsx` + `app/invite/InviteForm.tsx` | Minimal admin page: enter an email, create an invite record |
| `app/signin/page.tsx` | Sign-in page: Google button + email magic-link form |
| `app/providers.tsx` | `SessionProvider` wrapper (required for `useSession`/`signIn` client hooks) |
| `middleware.ts` | Protect all routes except `/signin` and NextAuth's own API routes |
| `lib/invites.test.ts`, `lib/db.test.ts` | Tests for the invite-gating logic and the Prisma client, run against the real dev database |

### Files to Modify

| File | Changes |
|------|---------|
| `app/layout.tsx` | Wrap children in `<Providers>` |
| `README.md` | Add an "Auth" section documenting invite-only signup and where env vars come from |

### Tests

| Test File | Coverage |
|-----------|----------|
| `lib/invites.test.ts` | No invite → not invited; unconsumed invite → invited; consumed invite → not invited |
| `lib/db.test.ts` | Prisma client resolves and can query the real database |

## Technical Details

- **Invite-gating logic lives in `lib/invites.ts`**, called from the NextAuth `signIn` callback — this is the single choke point for both Google and Email providers, and is directly unit-testable without needing to simulate a full OAuth handshake.
- Since `Household`/`Member` don't exist yet, `Invite` in this work item is intentionally minimal (just gates "can this email create a `User` at all"). `household-member-model` will add household-scoping on top.
- `middleware.ts` uses `withAuth` from `next-auth/middleware` with an explicit `pages.signIn` override — the bare default export does *not* pick up the custom sign-in page and redirects to NextAuth's built-in one instead.
- Session strategy is JWT (not database sessions) so middleware can verify auth at the edge without a Prisma call — the adapter is still used for account/user persistence.
- Google OAuth redirect URIs are already configured for both `localhost:3000` and the production Vercel URL.

---
*Plan approved at checkpoint. Execution follows.*

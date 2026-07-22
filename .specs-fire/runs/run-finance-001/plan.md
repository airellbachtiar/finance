---
run: run-finance-001
work_item: project-scaffold
intent: family-ledger
mode: confirm
checkpoint: plan
approved_at: pending
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
*Plan pending approval.*

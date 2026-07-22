---
run: run-finance-001
work_item: project-scaffold, auth-setup, household-member-model, expense-model, settlement-model, balance-engine, dashboard-ui
intent: family-ledger
generated: "2026-07-22T18:20:00Z"
mode: wide batch (confirm x6, validate x1)
---

# Implementation Walkthrough: Family Ledger MVP

## Summary

The full MVP for Family Ledger is built, tested, and deployed: invite-only auth (Google + email), households with login and non-login members, expenses with EUR/IDR currency conversion and configurable splits, settlements for both routine and bulk transfers, a pairwise balance engine deriving everything from the event log, and a dashboard tying it together. Live at `https://finance-rho-orcin.vercel.app` (custom domain `airell.moe` registered and propagating).

## Structure Overview

Next.js App Router, one Postgres database (Neon) via Prisma. Auth gates every route except `/signin` via middleware. Everything below auth is scoped to a `Household`: members, expenses, settlements. Two library layers do the real work — `lib/*.ts` (domain logic, fully unit/integration tested against the real dev database) and thin `app/api/**/route.ts` handlers that just do auth checks and call into `lib/`. No balance is ever stored: `lib/balance-engine.ts` recomputes it from `Expense`/`ExpenseSplit`/`Settlement` on every read.

## Architecture

### Pattern Used

Thin route handlers over a domain-logic library layer — route handlers only do session/permission checks and translate HTTP <-> `lib/` calls; all actual business logic (currency conversion, split math, balance netting) lives in `lib/` where it's directly unit-testable without spinning up HTTP.

### Layer Structure

```text
┌───────────────────────────────────────────┐
│  UI (Server + Client Components)          │
│  app/households/**, app/signin, app/invite│
├───────────────────────────────────────────┤
│  API routes (auth/permission checks only) │
│  app/api/households/**, app/api/invites   │
├───────────────────────────────────────────┤
│  Domain logic (lib/*.ts) — fully tested   │
│  households, expenses, settlements,       │
│  currency, balance-engine, dashboard      │
├───────────────────────────────────────────┤
│  Prisma + Neon Postgres                   │
└───────────────────────────────────────────┘
```

## Files Changed

### Created

| File | Purpose |
|------|---------|
| Next.js/Prisma/Vercel scaffold (`package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `vercel.json`, `prisma/schema.prisma`, etc.) | Project foundation |
| `lib/auth.ts`, `lib/invites.ts`, `app/api/auth/[...nextauth]/route.ts`, `app/signin/page.tsx`, `app/invite/**`, `middleware.ts` | Invite-only auth (Google + email) |
| `lib/households.ts`, `app/api/households/**`, `app/households/**` | Household/member CRUD, including non-login members |
| `lib/currency.ts`, `lib/expenses.ts`, `app/api/households/[id]/expenses/**`, `app/households/[id]/expenses/**` | Expenses with splits and EUR conversion |
| `lib/settlements.ts`, `app/api/households/[id]/settlements/**`, `app/households/[id]/settlements/**` | Settlements between members |
| `lib/balance-engine.ts` | Pairwise balance derivation — the core correctness-critical piece |
| `lib/dashboard.ts`, `app/households/[id]/BalanceSummary.tsx` | "Why"/history behind a balance, dashboard rendering |
| `lib/*.test.ts` (9 files, 40 tests total) | All of the above, tested against the real Neon dev database |

### Modified

| File | Changes |
|------|---------|
| `app/households/[id]/page.tsx` | Grew from a bare member list into the full dashboard: balances, expandable history, household switcher, links to expenses/settlements |
| `app/layout.tsx` | Wrapped in `<Providers>` (NextAuth `SessionProvider`) |
| `.gitignore` | Fixed a Vercel-CLI-introduced rule that accidentally excluded `.env.example`; added FIRE tooling's isolated `node_modules` |

## Domain Model

### Entities

| Entity | Properties | Business Rules |
|--------|------------|-----------------|
| `Household` | id, name | Container for members/expenses/settlements; no cross-household leakage anywhere |
| `Member` | id, displayName, role (ADMIN/MEMBER), nullable `userId` | One membership per household; nullable `userId` supports non-login members (Mama); the same person can hold separate `Member` rows in multiple households |
| `Invite` | email, nullable `householdId`, `consumedAt` | Gates account creation; household-scoped invites auto-create the `Member` row on first sign-in |
| `Expense` | payer, date, category, original currency/amount, exchange rate, converted EUR amount | Non-EUR requires a rate; splits always sum exactly to the converted total |
| `ExpenseSplit` | expense, member, shareEur | One row per participating member (payer excluded unless they're also a split member) |
| `Settlement` | from-member, to-member, date, original currency/amount, converted EUR amount | Not tied to any expense — works for both routine and bulk/irregular transfers |

## Key Implementation Details

### 1. Money is `Decimal`, never `float`, end to end

Every amount field (`Expense.originalAmount`, `convertedAmountEur`, `ExpenseSplit.shareEur`, `Settlement` equivalents) is a Prisma `Decimal`. Equal splits distribute the leftover remainder cent-by-cent so shares always sum *exactly* to the total (`€100/3` → `33.33/33.33/33.34`, never `33.33×3 = 99.99`).

### 2. The balance engine nets settlements against expense debts via simple signed addition

Every expense split (except the payer's own share) is a debt: member owes payer. Every settlement is recorded as the *reverse* debt (recipient owes payer, in the netting sense), which cancels a matching expense-driven debt through plain addition — no separate reconciliation step. Verified order-independent: the same events processed in a different order produce an identical result.

### 3. "Since when" is honestly scoped

Rather than pretending to know which *specific* expense a partial settlement paid off (which would require an arbitrary FIFO/LIFO assumption, contradicting order-independence), "since" is simply the oldest activity date between a pair. Flagged explicitly in the balance-engine design doc and approved before implementation.

### 4. Non-login members are first-class, not a workaround

`Member.userId` is nullable everywhere it's used — household membership, expense splits, settlement parties, balance computation. Mama (or any future non-login member) flows through every layer identically to a logged-in member; nothing special-cases her.

## Security Considerations

| Concern | Approach |
|---------|----------|
| Public signup | Fully invite-only; `signIn` callback rejects and cleans up any uninvited account the adapter would otherwise leave dangling |
| Cross-household data leakage | Every domain model carries a direct `householdId`; a validation gap in expense splits (found while designing `balance-engine`) was closed and tested |
| Secrets | Neon `DATABASE_URL`, Google OAuth credentials, Gmail app password, `NEXTAUTH_SECRET` — all in `.env.local` (gitignored) and Vercel's encrypted env vars, never committed (verified via `git check-ignore`/`git status` at every commit) |
| Settlement authority | Admin-gated (unlike expenses) since recording one asserts a debt is paid |

## Performance Considerations

| Requirement | Implementation |
|-------------|-----------------|
| Dashboard loads well under 1s | Batched `Promise.all` queries, no N+1s; verified structurally rather than load-tested, since the realistic data volume (~5 users, dozens of records/year) makes this a non-issue |

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Ledger model | Event log (expenses + settlements), balances always derived, never stored | Simpler than double-entry accounting, still fully auditable |
| Household scoping | One generic `Household` model reused for both "Apartment" and "Family" | Avoids building two concepts for structurally the same problem |
| Balance granularity | Full pairwise balances, not just "relative to the viewer" | Matches the dashboard's actual need and is a superset of any simpler view |
| Expense authorship | Any household member can add/edit/delete | Low-stakes, trusted small-family tool |
| Settlement authorship | Admin-only | Recording one asserts a debt is paid — more consequential to get wrong |
| Custom domain | `airell.moe`, registered directly through Vercel | Auto-configures DNS with zero manual steps, unlike an external registrar |

## Deviations from Plan

- `expense-model`'s and `auth-setup`'s originally-planned Prisma client (`lib/db.ts`) was deferred one step each time Prisma refused to `generate` against a model-less schema — resolved by the time real models existed.
- `dashboard-ui`'s full custom per-member-amount split UI and expense edit UI were scoped out in planning (API/lib support exists and is tested; UI wasn't built) — a deliberate, pre-approved scope cut, not an oversight.
- FIFO-matched "since" tracking (vs. "oldest activity") was considered and explicitly rejected in the `balance-engine` design doc as conflicting with the order-independence requirement.

## Dependencies Added

| Package | Why Needed |
|---------|------------|
| `next`, `react`, `react-dom` | Application framework |
| `@prisma/client`, `prisma` | Database ORM/migrations |
| `next-auth`, `@next-auth/prisma-adapter` | Authentication |
| `nodemailer` | Email magic-link transport |
| `vitest`, `dotenv` | Testing, env loading for tests |
| `tailwindcss`, `prettier`, `eslint`/`eslint-config-next` | Styling, formatting, linting |

## How to Verify

1. **Run the full test suite**

   ```bash
   npm run test
   ```

   Expected: 40 tests passing across 9 files.

2. **Build for production**

   ```bash
   npm run build
   ```

   Expected: clean compile, lint, and type-check.

3. **Sign in and try the real flow**

   Visit `https://finance-rho-orcin.vercel.app/signin` (an invite is already seeded for `airell.bachtiar@gmail.com`), sign in with Google, create a household, add members (including a non-login one), log an expense, record a settlement, and check the dashboard shows the expected balance.

## Test Coverage

- Tests added: 40
- Coverage: not measured as a percentage (per `testing-standards.md`, judged by critical-path coverage rather than a numeric target) — every acceptance-criteria scenario across all 7 work items has a dedicated test
- Status: passing

## Ready for Review

- [x] All acceptance criteria met
- [x] Tests passing
- [x] No critical issues
- [x] Documentation updated (README, standards docs)
- [x] Developer notes captured

## Developer Notes

- **Prisma on Vercel**: `"postinstall": "prisma generate"` in `package.json` is load-bearing — without it, Vercel's build never generates the client and every route using Prisma crashes at runtime. Easy to miss since local dev works fine without it (you've already run `prisma migrate dev` locally, which generates it too).
- **NextAuth + JWT sessions**: `session.user.id` is not populated by default under the JWT strategy — needs explicit `jwt`/`session` callbacks (see `lib/auth.ts`) plus a `types/next-auth.d.ts` module augmentation, or every household-scoped route silently 401s.
- **`next-auth/middleware`'s bare default export ignores your custom sign-in page** — you must use `withAuth({ pages: { signIn: '/signin' } })` explicitly, or unauthenticated users land on NextAuth's unstyled built-in page instead.
- **Custom domains registered through Vercel itself** (as opposed to an external registrar pointed at Vercel via DNS) configure automatically — no manual DNS record needed, just a propagation delay.
- **Gmail SMTP works fine for magic links at this scale**, but plan to move to a dedicated transactional provider (Resend, Postmark) once `airell.moe` is verified — unverified-domain accounts on those providers currently can't send to arbitrary recipients (only your own verified address), which is why Gmail was used for v1.

---
*Generated by specs.md - fabriqa.ai FIRE Flow Run run-finance-001*

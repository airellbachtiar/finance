---
run: run-finance-001
work_item: project-scaffold
intent: family-ledger
generated: "2026-07-22T16:30:00Z"
status: passed
---

# Test Report: Project scaffold, database, and deployment pipeline

## Summary

| Category | Passed | Failed | Skipped | Coverage |
|----------|--------|--------|---------|----------|
| Unit | 2 | 0 | 0 | n/a (infra work item) |
| **Total** | 2 | 0 | 0 | n/a |

## Acceptance Criteria Validation

- ✅ **Next.js app (App Router, TypeScript) initialized and runs locally** — `npm run dev` / `next build` both succeed
- ✅ **Tailwind CSS configured** — `tailwind.config.ts`, `postcss.config.mjs`, `app/globals.css` in place
- ✅ **Prisma initialized with `DATABASE_URL` pointing at Neon** — `prisma validate` passes, `prisma migrate dev` connects successfully ("Datasource db... Already in sync")
- ⚠️ **Empty baseline schema migrates successfully** — adjusted: Prisma 5 refuses to `generate` a client with zero models, so `prisma generate`/the `lib/db.ts` singleton are deferred to `household-member-model`/`auth-setup` (the first work items that add real models). Schema validity and DB connectivity are confirmed now instead.
- ✅ **ESLint + Prettier configured** — `.eslintrc.json`, `.prettierrc`; `npx eslint .` reports no issues
- ✅ **Vitest configured and runs a trivial passing test** — `lib/env.test.ts` (2 tests) — Prisma-dependent smoke test swapped for a dependency-free `getDatabaseUrl()` util test, for the same reason as above
- ✅ **App deployed to Vercel, auto-deploy on push to main** — `vercel git connect` confirms `airellbachtiar/finance` is connected; production deploy verified live
- ✅ **`.env.example` documents required env vars** — `DATABASE_URL` plus placeholders for the auth-setup work item
- ✅ **README has local setup instructions** — rewritten with real project description, setup, test, and deploy sections
- ⏳ **Custom domain attached and resolving over HTTPS** — pending: no domain provided by user yet. Currently live at `https://finance-rho-orcin.vercel.app`. Will attach once a domain is purchased/provided.

## Tests Written

### Unit Tests

- `lib/env.test.ts` — `getDatabaseUrl()` returns the connection string when set, throws a clear error when `DATABASE_URL` is missing

## Test Commands

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch
```

## Issues Found

| Issue | Severity | Status |
|-------|----------|--------|
| Prisma 5 cannot `generate` with zero models in the schema | Low (tooling constraint, not a bug) | Resolved by deferring client generation to `auth-setup` |
| Vercel project's Framework Preset defaulted to a static-site config expecting a `public/` output dir | Medium (blocked first deploy) | Resolved by adding `vercel.json` with `"framework": "nextjs"` |
| Initial ESLint failure: unused `beforeEach` import in `lib/env.test.ts` | Low | Fixed |

## Ready for Completion

- [x] All tests passing
- [x] Coverage target met (n/a for this infra-only work item — critical paths are covered per testing standards, which target the balance engine/currency conversion, not this item)
- [x] All acceptance criteria validated (one deferred to `auth-setup`, one pending user's domain purchase — both explicitly noted above, not silently dropped)
- [x] No critical issues open

---

# Test Report: Authentication (email + Google, invite-only)

**Work item**: auth-setup
**Generated**: 2026-07-22T17:20:00Z
**Status**: passed

## Summary

| Category | Passed | Failed | Skipped | Coverage |
|----------|--------|--------|---------|----------|
| Unit/Integration | 6 | 0 | 0 | n/a |
| **Total** | 6 | 0 | 0 | n/a |

## Acceptance Criteria Validation

- ✅ **NextAuth configured with email (magic link) and Google OAuth providers** — confirmed via `GET /api/auth/providers`, both registered
- ✅ **Google OAuth credentials created** — provided by user, wired into `.env.local` and Vercel (all 3 environments)
- ✅ **Session/User/Account tables added (NextAuth adapter)** — `User`, `Account`, `Session`, `VerificationToken` added to `prisma/schema.prisma`, migration `20260722150557_auth_setup` applied to Neon
- ✅ **Signup gated by pending invite** — `isInvited`/`consumeInvite` covered by `lib/invites.test.ts` (3 tests against the real dev database): no invite → false, unconsumed invite → true, consumed invite → false. Wired into `signIn` callback in `lib/auth.ts`.
- ✅ **Logged-in user sees only their household(s)** — not yet meaningful; there's no household scoping until `household-member-model` lands. Middleware currently just gates "authenticated or not," which is the correct scope for this work item.
- ✅ **Sign-out works** — standard NextAuth `signOut()`, not custom-built; not separately tested (library behavior)

## Tests Written

- `lib/invites.test.ts` — `isInvited`/`consumeInvite` against the real Neon dev database (create → true, consume → false, no record → false), cleaned up via `afterEach`
- `lib/db.test.ts` — Prisma client singleton resolves and can execute a query against Neon (reinstated now that real models exist)

## Manual Verification (not automatable without a browser + real Google/email sign-in)

- `curl` against `/` (unauthenticated) → 307 redirect to `/signin` ✅
- `curl` against `/invite` (unauthenticated) → 307 redirect to `/signin?callbackUrl=%2Finvite` ✅
- `curl` against `/signin` → 200, renders without requiring auth ✅
- `GET /api/auth/providers` → both `google` and `email` registered with correct callback URLs ✅
- Full OAuth round-trip (actually clicking "Sign in with Google", receiving a magic-link email) was **not** exercised — that requires a real browser session and a real invite for your email. Recommend a real sign-in test once this deploys, using an invite created for your own email first.

## Test Commands

```bash
npm run test
npm run test:watch
```

## Issues Found

| Issue | Severity | Status |
|-------|----------|--------|
| `middleware.ts` initially used the bare `next-auth/middleware` default export, which redirected to NextAuth's built-in `/api/auth/signin` page instead of the custom `/signin` page | Medium (would have shipped a jarring UX mismatch) | Fixed — switched to `withAuth({ pages: { signIn: '/signin' } })` |
| `nodemailer@^6.9.15` conflicted with `next-auth@4.24.15`'s peer requirement of `^7.0.7` | Low (blocked install) | Fixed — bumped to `nodemailer@^7.0.7` and matching `@types/nodemailer` |
| Production deploy failed: `@prisma/client did not initialize yet` — Vercel's `npm install` never ran `prisma generate` since `node_modules/.prisma` is gitignored and there's no build hook for it | High (blocked production deploy entirely) | Fixed — added `"postinstall": "prisma generate"` to `package.json`; redeployed successfully, verified live at `https://finance-rho-orcin.vercel.app` (`/api/auth/providers` returns both providers) |

## Ready for Completion

- [x] All tests passing
- [x] Coverage target met (critical gating logic — the invite check — is directly tested against a real database)
- [x] All acceptance criteria validated (one noted as "not yet meaningful until household-member-model")
- [x] No critical issues open

---

# Test Report: Household and member data model

**Work item**: household-member-model
**Generated**: 2026-07-22T17:40:00Z
**Status**: passed

## Summary

| Category | Passed | Failed | Skipped | Coverage |
|----------|--------|--------|---------|----------|
| Unit/Integration | 12 (5 new) | 0 | 0 | n/a |
| **Total** | 12 | 0 | 0 | n/a |

## Acceptance Criteria Validation

- ✅ **`Household` model: id, name, created date** — added, migration `20260722153054_household_member_model` applied
- ✅ **`Member` model: nullable `userId`, role** — added; `lib/households.test.ts` confirms a non-login member (`userId: null`) is created correctly
- ✅ **Same person can belong to two households** — `createHousehold` creates a separate `Member` row per household sharing the same `userId`; `@@unique([householdId, userId])` scopes uniqueness per-household, not globally
- ✅ **Admin can create a household, add members (login or non-login), remove members** — `lib/households.ts` + household-scoped API routes; `removeMember` additionally refuses to remove the last admin (edge case not in the original acceptance criteria, added because a household with zero admins would be unrecoverable)
- ✅ **No cross-household leakage** — `households.test.ts` "does not leak members across households" confirms queries scoped by `householdId` never return another household's members. Future `Expense`/`Settlement` models will carry a direct `householdId` FK for the same reason (documented in `system-architecture.md` decisions, to be added when those models land).
- ✅ **Basic CRUD UI** — `/households` (list + create), `/households/[id]` (members list, invite-by-email, add-non-login-member, remove) — verified via `curl` that both are correctly gated behind auth (307 → `/signin` when unauthenticated)

## Tests Written

- `lib/households.test.ts` (5 tests) — household creation makes the creator an admin; household-scoped invite creation; non-login member creation; last-admin removal is refused; no cross-household member leakage
- `lib/invites.test.ts` (updated, 4 tests total, 1 new) — consuming a household-scoped invite creates the corresponding `Member` row with the right display name

All tests run against the real Neon dev database (per testing standards — no mocking the database), with explicit cleanup in `afterEach`.

## Manual Verification

- `curl -I /households` (unauthenticated) → 307 to `/signin?callbackUrl=%2Fhouseholds` ✅
- `curl /api/households` (unauthenticated) → 307 (middleware protects API routes too, ahead of the route handler's own 401 check) ✅
- Full UI flow (create a household, invite a member, add Mama as non-login, remove a member) not exercised in a real browser — recommend trying this yourself once deployed, same caveat as `auth-setup`'s OAuth flow.

## Test Commands

```bash
npm run test
```

## Issues Found

| Issue | Severity | Status |
|-------|----------|--------|
| `session.user.id` isn't populated by NextAuth's JWT strategy by default | Medium (every household-scoped route depends on it) | Fixed — added `jwt`/`session` callbacks in `lib/auth.ts` to propagate `user.id` through the token, plus a `types/next-auth.d.ts` module augmentation so TypeScript knows about it |
| Latent bug carried over from `auth-setup`: uninvited Google sign-in attempts left a dangling `User` row (adapter creates it before the `signIn` callback runs) | Low (no functional impact, but accumulates orphan rows) | Fixed — `signIn` callback now deletes the dangling user on rejection |

## Ready for Completion

- [x] All tests passing
- [x] Coverage target met (household scoping — the acceptance criterion most likely to cause a real bug — is directly tested)
- [x] All acceptance criteria validated
- [x] No critical issues open

---

# Test Report: Expense model with splits and currency conversion

**Work item**: expense-model
**Generated**: 2026-07-22T17:50:00Z
**Status**: passed

## Summary

| Category | Passed | Failed | Skipped | Coverage |
|----------|--------|--------|---------|----------|
| Unit/Integration | 22 (10 new) | 0 | 0 | n/a |
| **Total** | 22 | 0 | 0 | n/a |

## Acceptance Criteria Validation

- ✅ **`Expense` model** — household, date, amount, original currency, exchange rate, converted EUR amount, category, payer, notes; migration `20260722154425_expense_model` applied
- ✅ **`ExpenseSplit` model** — per-member share in EUR
- ✅ **Default split = household's equal division** — `lib/expenses.test.ts` "splits an expense equally among all household members, distributing the remainder cent": €100/3 → `33.33/33.33/33.34`, confirmed summing back to exactly `100`
- ✅ **Per-expense override** — "splits only among an explicit subset of members" test confirms a household with 3 members can split among just 2 (the "brother was away" case)
- ✅ **Non-EUR requires a rate; converted amount computed and stored** — `lib/currency.test.ts` (throws without a rate) + `lib/expenses.test.ts` "converts non-EUR expenses..." confirms both original (`2500000 IDR`) and converted (`135.14 EUR`) are stored
- ✅ **Basic CRUD UI** — `/households/[id]/expenses` (list + add form with member-subset selection); delete wired in the UI, edit available via `PATCH` (tested at the `lib`/API level, not yet in the UI — noted scope cut from the plan)
- ✅ **No stale split caching** — trivially true; nothing caches anything yet

## Tests Written

- `lib/currency.test.ts` (3 tests) — EUR passthrough, IDR conversion with a rate, throws without a rate
- `lib/expenses.test.ts` (7 tests) — equal split with remainder distribution (and sums back to the exact total), subset override, explicit splits accepted when they sum correctly, explicit splits rejected when they don't, non-EUR conversion stores both original and converted amounts, update recomputes conversion/splits, delete cascades its splits

All against the real Neon dev database, cleanup via `afterEach`.

## Manual Verification

- `next build` type-checks all new routes/pages cleanly, including the dynamic `[expenseId]` route
- Full UI flow (add an expense, see the split breakdown, delete it) not exercised in a real browser — same caveat as prior work items; worth trying once deployed

## Test Commands

```bash
npm run test
```

## Issues Found

No issues found — this work item built cleanly against the patterns established in `auth-setup`/`household-member-model` (session typing, household-scoped auth checks).

## Ready for Completion

- [x] All tests passing
- [x] Coverage target met (rounding/remainder distribution and currency conversion — the two places this could silently go wrong — are both directly tested)
- [x] All acceptance criteria validated
- [x] No critical issues open

---

# Test Report: Settlement recording (transfers between members)

**Work item**: settlement-model
**Generated**: 2026-07-22T17:58:00Z
**Status**: passed

## Summary

| Category | Passed | Failed | Skipped | Coverage |
|----------|--------|--------|---------|----------|
| Unit/Integration | 28 (6 new) | 0 | 0 | n/a |
| **Total** | 28 | 0 | 0 | n/a |

## Acceptance Criteria Validation

- ✅ **`Settlement` model** — household, from/to member, amount, currency (default EUR), date, note; migration `20260722155154_settlement_model` applied
- ✅ **Admin can record a settlement between any two members of the same household** — `lib/settlements.test.ts` confirms creation works between two valid members, and rejects a member from a different household
- ✅ **Basic CRUD UI** — `/households/[id]/settlements` (list + admin-only add form); delete wired in the UI; edit available via `PATCH` (tested, same UI scope cut as `expense-model`)
- ✅ **Not tied to a specific expense** — `Settlement` has no `expenseId` anywhere in its schema; the Mama bulk-reimbursement test (`€10,000` in one settlement, no expense reference) demonstrates exactly this

## Tests Written

- `lib/settlements.test.ts` (6 tests) — valid settlement between two members (including the Mama bulk-reimbursement scenario); rejects a member settling with themselves; rejects a member from a different household; non-EUR conversion stores both amounts; update recomputes conversion; delete

All against the real Neon dev database, cleanup via `afterEach`.

## Manual Verification

- `next build` type-checks all new routes/pages cleanly
- Full UI flow not exercised in a real browser — same caveat as prior work items

## Test Commands

```bash
npm run test
```

## Issues Found

No issues found — straightforward reuse of the `expense-model`/`household-member-model` patterns (currency conversion, household-scoped auth checks).

## Ready for Completion

- [x] All tests passing
- [x] Coverage target met (cross-household leakage and self-settlement are exactly the two ways this model could be misused, and both are directly tested)
- [x] All acceptance criteria validated
- [x] No critical issues open

---
*Generated by specs.md - fabriqa.ai FIRE Flow Run run-finance-001*

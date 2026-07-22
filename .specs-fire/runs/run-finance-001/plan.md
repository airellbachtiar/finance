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

## Work Item: household-member-model

### Approach

Add `Household` and `Member` models. A `Member` is a single household membership: it optionally links to a `User` (nullable — this is what makes Mama representable) and always belongs to exactly one `Household`, with a `role` (`ADMIN`/`MEMBER`). Someone who's part of two households (you, in both Apartment and Family) simply has two separate `Member` rows sharing the same `userId`.

Any authenticated user can create a household — they become its first `ADMIN` member automatically (like creating a group in Splitwise). Adding a login-required member reuses/extends the `Invite` model from `auth-setup` — an admin creates an invite scoped to a household, and when that person signs in for the first time, a `Member` row is created for them automatically. Adding a non-login member (e.g. Mama) just creates a `Member` row directly with a display name and no `userId` — no invite involved.

**Fixing a latent issue from `auth-setup` while I'm in `lib/auth.ts` anyway**: NextAuth's Prisma adapter creates the `User` row *before* the `signIn` callback runs, so an uninvited person attempting Google sign-in would leave a dangling, useless `User` record even though we correctly reject them. Adding cleanup: if `signIn` rejects, delete that just-created `User`.

Cross-household leakage prevention (an acceptance criterion) isn't fully enforceable yet since `Expense`/`Settlement` don't exist — but the decision that governs it is locked in now: those future models will always carry a direct `householdId` foreign key (not just reachable via `Member`), so every query scopes with `where: { householdId }` and there's no path to accidentally join across households.

### Files to Create

| File | Purpose |
|------|---------|
| `lib/households.ts` | `createHousehold`, `isHouseholdAdmin`, `addMember` (login-invite path or direct non-login path), `removeMember` |
| `app/api/households/route.ts` | `POST` create a household (creator becomes ADMIN), `GET` list the current user's households |
| `app/api/households/[id]/members/route.ts` | `GET` list members (must belong to household), `POST` add a member (admin only — either `{ email }` to invite a login member, or `{ displayName }` for a non-login member) |
| `app/api/households/[id]/members/[memberId]/route.ts` | `DELETE` remove a member (admin only; refuses to remove the last remaining admin) |
| `app/households/page.tsx` + `app/households/HouseholdForm.tsx` | List your households, create a new one |
| `app/households/[id]/page.tsx` + `app/households/[id]/MemberForm.tsx` | Household detail: members list (name, role, login/no-login), add-member form, remove buttons (admin only) |
| `lib/households.test.ts` | `createHousehold` creates household + admin member; `addMember` (login invite path creates a household-scoped `Invite`, non-login path creates a `Member` directly); `removeMember` refuses to remove the last admin; a member fetched under household A never appears under household B |

### Files to Modify

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add `Household`, `Member`, `Role` enum; extend `Invite` with optional `householdId` |
| `lib/invites.ts` | `consumeInvite` now takes `(email, userId, displayName)` and creates the `Member` row when the invite is household-scoped |
| `lib/auth.ts` | Pass `user.id`/`user.name` into `consumeInvite`; delete the dangling `User` on rejected sign-in |
| `lib/invites.test.ts` | Update for the new `consumeInvite` signature; add a case covering household-linking on consumption |

### Tests

| Test File | Coverage |
|-----------|----------|
| `lib/households.test.ts` | Household creation → creator is ADMIN; login-invite path creates a scoped Invite; non-login path creates a Member directly; removing the last admin is refused; household-scoped queries don't leak across households |
| `lib/invites.test.ts` (updated) | Consuming a household-scoped invite creates the corresponding Member row with the right display name |

## Technical Details

- `Member` uniqueness: `@@unique([householdId, userId])` — Postgres treats each `NULL` as distinct in a unique index, so multiple non-login members (`userId: null`) in the same household are allowed, which is exactly what we want (there could be more than one non-login member someday).
- No global "admin" concept — admin-ness is per-household (a `Member.role`), except `ADMIN_EMAIL` which remains a bootstrap-only superadmin for the original `/invite` page (household-less invites). Household member-adding goes through the new household-scoped endpoint instead.
- UI stays plain/utilitarian (forms, no styling polish) — same bar as `auth-setup`'s sign-in/invite pages.

---
*Plan approved at checkpoint. Execution follows.*

---

## Work Item: expense-model

### Approach

`Expense` (household, payer, date, category, notes, original currency/amount, exchange rate, converted EUR amount) + `ExpenseSplit` (per-member share, in EUR). Amounts use Prisma's `Decimal` type throughout, not floats — money math needs exact decimal arithmetic, not binary floating point, and this is the data the future `balance-engine` will read directly, so precision has to be right at the source.

**Default split decision**: rather than storing a "default split percentage" on `Household`/`Member` (a new concept), the default is computed dynamically — equal division among all *current* members of the household at the time the expense is created. This matches every example in the spec (equal 33.3/33.3/33.3 is just "equal division among 3 members") without adding a redundant stored value that could drift out of sync with actual membership. Per-expense override is supported by passing an explicit subset of member IDs (covers "one brother was away — split between just the other two") or, at the API level, fully explicit per-member amounts for future flexibility.

**Rounding**: equal splits won't always divide evenly (€100 / 3 = 33.33/33.33/33.34). Splits are computed in integer cents with the leftover remainder distributed one cent at a time starting from the first member, guaranteeing the splits always sum *exactly* to the converted total — no silent rounding drift.

**UI scope cut**: the add-expense form supports the equal-split-with-member-subset flow (covers the spec's actual examples) but not a full custom-per-member-amount input UI — that's exposed at the API/`lib` level (tested) for future use (e.g. a future dashboard editing flow) but not built into this pass's form, to keep this work item's UI scope proportionate. Editing an expense is supported at the API/lib level (tested) but the UI only exposes create + delete for now — full edit UI is a small follow-up, not core to the MVP's "who owes who" question.

### Files to Create

| File | Purpose |
|------|---------|
| `lib/currency.ts` | `convertToEur(amount, currency, rate)` — throws if a non-EUR amount has no rate |
| `lib/expenses.ts` | `createExpense`, `updateExpense`, `deleteExpense`, equal-split-with-remainder-distribution logic |
| `app/api/households/[id]/expenses/route.ts` | `GET` list expenses (any member), `POST` create (any member) |
| `app/api/households/[id]/expenses/[expenseId]/route.ts` | `PATCH` update, `DELETE` remove (any member — small trusted household, not admin-gated like membership changes) |
| `app/households/[id]/expenses/page.tsx` + `ExpenseForm.tsx` | List expenses (date, category, payer, original + converted amount, split breakdown), add-expense form |
| `lib/currency.test.ts` | EUR passthrough; non-EUR conversion; throws without a rate |
| `lib/expenses.test.ts` | Equal split among all members; equal split among an explicit subset; explicit splits validated to sum exactly; rejects mismatched explicit splits; update recomputes conversion/splits; delete cascades its splits |

### Files to Modify

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add `Expense`, `ExpenseSplit`; back-relations on `Household`/`Member` |
| `app/households/[id]/page.tsx` | Link to the household's expenses page |

### Tests

| Test File | Coverage |
|-----------|----------|
| `lib/currency.test.ts` | EUR amount passes through unchanged; IDR amount converts using the given rate; missing rate for non-EUR throws |
| `lib/expenses.test.ts` | Default equal split across all members (including the remainder-cent case, e.g. €100/3); subset override; explicit splits that sum correctly are accepted; explicit splits that don't sum correctly are rejected; editing an expense recomputes everything; deleting removes its splits too |

## Technical Details

- `Expense.originalAmount`/`convertedAmountEur` are `Decimal(14, 2)`; `exchangeRate` is `Decimal(14, 6)` (nullable — required only for non-EUR).
- `ExpenseSplit.shareEur` is `Decimal(14, 2)`, one row per member, `@@unique([expenseId, memberId])`.
- Any household member (not just admins) can add/edit/delete expenses — this is a small trusted-family tool, and gating expense entry behind admin status would just create friction for the actual use case (a brother logging groceries he paid for).
- "No caching of stale split data" is trivially satisfied right now — there's no cache anywhere in the codebase yet; the future `balance-engine` will read `Expense`/`ExpenseSplit` directly from Postgres on every computation.

---
*Plan pending approval.*

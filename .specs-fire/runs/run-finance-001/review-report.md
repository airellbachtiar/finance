# Code Review Report

**Run**: run-finance-001
**Intent**: family-ledger
**Reviewed**: 2026-07-22T16:35:00Z
**Files Reviewed**: 20

---

## Summary

| Category | Auto-Fixed | Applied | Skipped |
|----------|------------|---------|---------|
| Code Quality | 1 | 0 | 0 |
| Security | 0 | 1 | 0 |
| Architecture | 0 | 1 | 0 |
| Testing | 0 | 0 | 0 |
| **Total** | **1** | **2** | **0** |

**Tests Status**: Passing

---

## Files Reviewed

- `package.json` (config)
- `tsconfig.json` (config)
- `next.config.mjs` (config)
- `tailwind.config.ts` (config)
- `postcss.config.mjs` (config)
- `vitest.config.ts` (config)
- `vercel.json` (config)
- `.eslintrc.json` (config)
- `.prettierrc` (config)
- `.gitignore` (config)
- `.env.example` (config)
- `app/layout.tsx` (source)
- `app/page.tsx` (source)
- `app/globals.css` (source)
- `prisma/schema.prisma` (schema)
- `lib/env.ts` (source)
- `lib/env.test.ts` (test)
- `README.md` (docs)

---

## Auto-Fixed Issues

These issues were automatically fixed (mechanical, non-semantic changes):

### 1. [Code Quality] Unused import in test file

- **File**: `lib/env.test.ts:1`
- **Description**: `beforeEach` was imported from `vitest` but never used, failing `next build`'s lint step.
- **Diff**:

```diff
-import { describe, it, expect, beforeEach, afterEach } from 'vitest'
+import { describe, it, expect, afterEach } from 'vitest'
```

---

## Applied Suggestions

These suggestions were approved and applied (applied directly during execution — see rationale for why they didn't need a separate approval round):

### 1. [Security] `.gitignore` `.env*` rule accidentally excluded `.env.example` from version control

- **File**: `.gitignore:43-44`
- **Description**: Vercel CLI's `vercel link` appended a broad `.env*` ignore rule, which also matched the tracked `.env.example` template (no secrets, meant to be committed so setup instructions are reproducible).
- **Rationale**: Silently losing `.env.example` from the repo would make README setup instructions reference a file nobody could see. Low risk, mechanical fix, verified via `git check-ignore`.
- **Risk Level**: Low
- **Diff**:

```diff
 .vercel
 .env*
+!.env.example
```

### 2. [Architecture] Prisma client singleton deferred rather than shipped broken

- **File**: `lib/db.ts` (removed), `lib/db.test.ts` (removed)
- **Description**: Prisma 5 refuses to `generate` a client with zero models defined, so `new PrismaClient()` at module load time would throw at runtime/test time. Removed the premature `lib/db.ts` singleton and its smoke test; added a dependency-free `lib/env.ts` + `lib/env.test.ts` instead to satisfy "Vitest runs a trivial passing test" without a broken import.
- **Rationale**: Per coding standards, "never log/ship a function that can't actually run." The Prisma client singleton is correctly the next work item's responsibility, once real models exist to generate against — see it reinstated below in the `auth-setup` review.
- **Risk Level**: Low — this is a scope deferral within the same work item, not a new architectural decision; it's flagged here and in `test-report.md` rather than silently absorbed.

---

## Skipped Suggestions

No suggestions were skipped.

---

## Project Tooling Used

The following project linters were detected and used:

- **ESLint**: `.eslintrc.json` (`eslint-config-next` + TypeScript rules) — `npx eslint .` clean
- **Prettier**: `.prettierrc` — not yet run repo-wide (no formatting drift introduced by this work item)

---

## Standards Referenced

- `.specs-fire/standards/coding-standards.md`
- `.specs-fire/standards/testing-standards.md`
- `.specs-fire/standards/tech-stack.md`
- `.specs-fire/standards/constitution.md`

---

# Code Review Report — auth-setup

**Reviewed**: 2026-07-22T17:25:00Z
**Files Reviewed**: 13 (incl. `package.json`)

## Summary

| Category | Auto-Fixed | Applied | Skipped |
|----------|------------|---------|---------|
| Code Quality | 0 | 0 | 0 |
| Security | 0 | 0 | 0 |
| Architecture | 0 | 2 | 0 |
| Testing | 0 | 0 | 0 |
| **Total** | **0** | **2** | **0** |

**Tests Status**: Passing

## Files Reviewed

- `prisma/schema.prisma` (schema)
- `lib/db.ts` (source, reinstated)
- `lib/invites.ts` (source)
- `lib/auth.ts` (source)
- `app/api/auth/[...nextauth]/route.ts` (source)
- `app/api/invites/route.ts` (source)
- `app/invite/page.tsx`, `app/invite/InviteForm.tsx` (source)
- `app/signin/page.tsx` (source)
- `app/providers.tsx` (source)
- `middleware.ts` (source)
- `lib/invites.test.ts`, `lib/db.test.ts` (test)

## Applied Suggestions

### 1. [Architecture] Middleware didn't respect the custom sign-in page

- **File**: `middleware.ts`
- **Description**: The bare `export { default } from 'next-auth/middleware'` doesn't read `authOptions.pages.signIn`, so unauthenticated requests were redirected to NextAuth's built-in `/api/auth/signin` instead of the app's own `/signin` page. Caught via manual `curl` verification against a running dev server, not by the automated test suite (this is a routing/UX behavior, not covered by the invite-gating unit tests).
- **Rationale**: Shipping this would have meant every unauthenticated visitor saw NextAuth's default unstyled sign-in page instead of the app's own — confusing UX and inconsistent with the rest of the app's design.
- **Risk Level**: Low — mechanical fix (`withAuth({ pages: { signIn: '/signin' } })`), re-verified via `curl` after the change.

## Skipped Suggestions

No suggestions were skipped.

## Project Tooling Used

- **ESLint**: clean, `npx next build` includes lint + type-check, no errors
- **Prettier**: not run repo-wide

## Standards Referenced

- `.specs-fire/standards/coding-standards.md`
- `.specs-fire/standards/testing-standards.md`
- `.specs-fire/standards/system-architecture.md`
- `.specs-fire/standards/constitution.md`

### 2. [Architecture] Missing `prisma generate` on Vercel's build

- **File**: `package.json`
- **Description**: Production deploy failed with `@prisma/client did not initialize yet` — Vercel's install step never runs `prisma generate` on its own, and the generated client directory is gitignored, so a fresh install on Vercel had no client to import.
- **Rationale**: Standard Prisma-on-Vercel gap; the fix is a `postinstall` hook so every fresh install (including Vercel's) regenerates the client automatically.
- **Risk Level**: Low — mechanical, verified by a successful redeploy and a live `curl` against `/api/auth/providers`.
- **Diff**:

```diff
   "scripts": {
     "dev": "next dev",
     "build": "next build",
     "start": "next start",
     "lint": "next lint",
     "test": "vitest run",
     "test:watch": "vitest",
-    "format": "prettier --write ."
+    "format": "prettier --write .",
+    "postinstall": "prisma generate"
   },
```

## Security Note

`GOOGLE_CLIENT_SECRET`, the Neon `DATABASE_URL`, and the Gmail app password all live only in `.env.local` (gitignored) and Vercel's encrypted environment variables — confirmed via `git status`/`git check-ignore` that none are present in tracked files.

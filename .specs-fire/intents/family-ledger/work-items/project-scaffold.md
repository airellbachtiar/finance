---
id: project-scaffold
title: Project scaffold, database, and deployment pipeline
intent: family-ledger
complexity: medium
mode: confirm
status: completed
depends_on: []
created: 2026-07-22T00:00:00Z
run_id: run-finance-001
completed_at: 2026-07-22T14:28:59.290Z
---

# Work Item: Project scaffold, database, and deployment pipeline

## Description

Initialize the Next.js (TypeScript) application with Prisma configured against a Postgres database (Neon), and wire up deployment to Vercel including the user's custom domain. This is the foundation every other work item builds on.

## Acceptance Criteria

- [ ] Next.js app (App Router, TypeScript) initialized and runs locally
- [ ] Tailwind CSS configured
- [ ] Prisma initialized with a `DATABASE_URL` pointing at a Neon Postgres instance (or Vercel Postgres)
- [ ] Empty baseline schema migrates successfully (`prisma migrate dev`)
- [ ] ESLint + Prettier configured per coding standards
- [ ] Vitest configured and runs a trivial passing test
- [ ] App deployed to Vercel from the git repo, auto-deploy on push to main
- [ ] User's custom domain attached to the Vercel project and resolving over HTTPS
- [ ] `.env.example` documents all required environment variables
- [ ] README has local setup instructions (env vars, migrate, run)

## Technical Notes

- User will need to purchase the domain themselves and have registrar DNS access; this work item includes guiding them through adding the CNAME/A record Vercel requires, not purchasing the domain.
- Neon free tier is sufficient at this scale — no need to evaluate alternatives.
- Do not build any domain models yet (households, expenses, etc.) — this item is infrastructure only.

## Dependencies

(none)

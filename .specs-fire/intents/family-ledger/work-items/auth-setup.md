---
id: auth-setup
title: Authentication (email + Google, invite-only)
intent: family-ledger
complexity: medium
mode: confirm
status: in_progress
depends_on:
  - project-scaffold
created: 2026-07-22T00:00:00Z
---

# Work Item: Authentication (email + Google, invite-only)

## Description

Set up NextAuth with email and Google login providers. Signup is invite-only — there is no public registration; a user can only create an account if they've been invited to a household by an admin.

## Acceptance Criteria

- [ ] NextAuth configured with email (magic link) and Google OAuth providers
- [ ] Google OAuth credentials created (user will need a Google Cloud project — guide them through this if they don't have one)
- [ ] Session/User/Account tables added to the Prisma schema (NextAuth adapter)
- [ ] Signup is gated: a new user can only complete registration if a matching pending invite exists
- [ ] Logged-in user sees only the household(s) they belong to
- [ ] Sign-out works

## Technical Notes

- "Mama" and other non-login members are handled entirely by the household/member model (see `household-member-model`), not by this auth work item — she never gets an account.
- Keep the invite mechanism simple for v1: an admin-created invite record (email + household) that's consumed on first login matching that email. No need for a full invite-email-sending system yet if a manually-shared link is good enough for ~5 users — confirm with user during planning checkpoint.

## Dependencies

- project-scaffold

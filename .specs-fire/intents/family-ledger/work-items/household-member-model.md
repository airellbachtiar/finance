---
id: household-member-model
title: Household and member data model
intent: family-ledger
complexity: medium
mode: confirm
status: in_progress
depends_on:
  - project-scaffold
created: 2026-07-22T00:00:00Z
---

# Work Item: Household and member data model

## Description

Model `Household` and `Member` as generic entities that support both the "Apartment" household (3 members, all with logins) and the "Family" household (user + Mama, who has no login). Members belong to households with a role (admin/member).

## Acceptance Criteria

- [ ] `Household` model: id, name, created date
- [ ] `Member` model: id, display name, optional link to a `User`/auth account (nullable — supports non-login members like Mama), role within a household (admin/member)
- [ ] A member can belong to exactly the household(s) they're part of; the same person (the admin) can belong to both "Apartment" and "Family"
- [ ] Admin can create a household, add members (with or without inviting a login), and remove members
- [ ] Data model prevents a household's expenses/settlements from ever being queryable cross-household (no accidental balance leakage between Apartment and Family)
- [ ] Basic CRUD UI: create household, list members, invite a member (triggers auth-setup's invite flow), add a non-login member

## Technical Notes

- Keep `Member` distinct from `User` (the auth identity) — a `Member` optionally references a `User`. This is what makes Mama representable without forcing every member to have an account.
- This work item does not need to build expenses or balances — just the structural model and basic management UI.

## Dependencies

- project-scaffold

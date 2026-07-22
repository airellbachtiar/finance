---
id: rebrand-and-tutorial
title: "Rebrand to Bachtiar Ledger, punch up copy, add a tutorial section"
intent: family-ledger
complexity: low
mode: confirm
status: completed
depends_on:
  - dashboard-ui
created: "2026-07-22T20:00:00Z"
---

# Work Item: Rebrand to Bachtiar Ledger, punch up copy, add a tutorial section

## Description

Three small, user-requested UI/copy changes:
1. Rename the app from "Family Ledger" to "Bachtiar Ledger" everywhere it's user-visible.
2. Improve copy that reads as plain/functional placeholder text into something with more personality, without undermining the trust a finance tool needs.
3. Add a tutorial/help page walking a new family member through the app (sign in → create households → add members → log expenses → record settlements → check the dashboard).

## Acceptance Criteria

- [x] "Family Ledger" replaced with "Bachtiar Ledger" in every user-facing surface: page titles/metadata, sign-in header, app header brand link, README
- [x] Internal/historical identifiers left alone (package.json name `family-ledger`, `.specs-fire` intent id/title/brief, git repo name) — renaming those would rewrite history for no user-facing benefit
- [x] Empty states and key copy reviewed for tone — still accurate and trustworthy, just more actionable ("no expenses logged yet — add the first one below" instead of a flat "no expenses yet")
- [x] A tutorial page exists (`/tutorial`), linked from the app header ("How it works"), walking through the core flow end to end
- [x] Tutorial content matches what the app actually does today — verified against the actual built features (invite gating, non-login members, splits, IBAN/QR payment panel, mark-as-paid, bulk settlements) rather than the original spec's full feature list

## Dependencies

- dashboard-ui

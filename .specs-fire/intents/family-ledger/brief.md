---
id: family-ledger
title: Family Ledger — Shared Household & Family Balance Tracker
status: completed
created: 2026-07-22T00:00:00Z
completed_at: 2026-07-22T16:15:41.462Z
---

# Intent: Family Ledger — Shared Household & Family Balance Tracker

## Goal

Build a lightweight shared ledger web app that lets any family member answer, within seconds: who owes who, how much, why, since when, and whether it's already been paid. The app is the single source of truth for family financial events — it never stores or lets anyone manually edit a balance; every balance is derived from a recorded history of expenses and settlements.

## Users

- **Admin (primary user)**: manages both households, invites members, records expenses/settlements, and logs entries on Mama's behalf since she has no login
- **Brother A / Brother B**: members of the "Apartment" household (shared flat) — can log in, view balances, add expenses/settlements
- **Mama**: a member of the "Family" household with no login account — reimbursements/expenses involving her are recorded by the admin

## Problem

Family finances are currently tracked informally across WhatsApp messages, spanning two countries (Netherlands, Indonesia) and two currencies (EUR, IDR). This makes it hard to know current balances, reconcile large bulk parent reimbursements (e.g. €10,000), find historical transactions, or trust that a number wasn't calculated wrong by hand. There's no audit trail and no receipts.

## Success Criteria

- Any member can see their current balance ("I owe X €Y" / "X owes me €Y") in seconds, per household
- Every displayed balance is provably derived from the recorded event log — there is no editable balance field anywhere in the system
- The "Apartment" household supports equal 3-way splits with per-expense overrides
- The "Family" household supports a non-login member (Mama) and bulk/irregular settlements against an accrued balance
- Expenses in IDR are stored with their original currency/amount/rate and a converted EUR amount; all reporting defaults to EUR
- Settlements (partial or full transfers) correctly reduce the derived balance
- The app is deployed 24/7 on the user's own custom domain

## Constraints

- Stack: Next.js (TypeScript) + Prisma + PostgreSQL (Neon), deployed on Vercel
- Auth: NextAuth with email + Google login, invite-only (no public signup)
- Hosting: user-purchased custom domain, DNS pointed at Vercel, no server maintenance
- Balances must never be a stored/mutable field — always computed from expenses + settlements
- No real bank/payment API integration (explicitly not using ING's API) — settlement details (IBAN, amount, reference) are displayed statically for the user to act on manually, then marked as paid

## Notes

This intent covers the MVP only. The following are explicitly deferred to future intents and are not part of this decomposition:
- Recurring/draft monthly expense templates (rent, utilities, etc.)
- "Household Month" grouping and statement view
- Payment-ready settlement summaries with IBAN/QR code display and "mark as paid" UX
- Receipt OCR, bank CSV import, automatic reminders, push notifications, monthly PDF summaries, spending analytics, debt-simplification algorithm, full PWA polish

Household scoping decision: rather than modeling "Apartment" and "parent reimbursement" as different concepts, both are instances of the same generic `Household` entity (members + expenses + settlements). This keeps the data model and balance engine uniform across both use cases.

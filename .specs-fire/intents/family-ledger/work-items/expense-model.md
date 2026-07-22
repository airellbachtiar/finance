---
id: expense-model
title: Expense model with splits and currency conversion
intent: family-ledger
complexity: medium
mode: confirm
status: completed
depends_on:
  - household-member-model
created: 2026-07-22T00:00:00Z
run_id: run-finance-001
completed_at: 2026-07-22T15:48:15.402Z
---

# Work Item: Expense model with splits and currency conversion

## Description

Model an `Expense` as a financial event: who paid, how much, in what currency, split among which members and in what proportions, with optional per-expense override of the household's default split.

## Acceptance Criteria

- [ ] `Expense` model: household, date, amount, original currency, exchange rate (nullable, required if currency != EUR), converted EUR amount, category, payer (Member), notes
- [ ] `ExpenseSplit` model: expense, member, share (amount or percentage owed by that member)
- [ ] Creating an expense with no override applies the household's default split (e.g. Apartment's equal 33.3/33.3/33.3)
- [ ] Creating an expense can override the split for that expense only (e.g. one brother away part of the month)
- [ ] Non-EUR expenses require an exchange rate before saving; the converted EUR amount is computed and stored alongside the original
- [ ] Basic CRUD UI: add expense (with split preview/override), list expenses for a household, edit/delete an expense
- [ ] Deleting/editing an expense is reflected immediately in any later balance computation (no caching of stale split data)

## Technical Notes

- Splits should sum to the expense's full amount — validate this on save (within rounding tolerance).
- Store the original currency/amount even for EUR expenses (rate = 1) for consistency, per the system architecture's "always preserve source data" decision.

## Dependencies

- household-member-model

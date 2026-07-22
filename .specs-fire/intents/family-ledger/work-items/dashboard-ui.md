---
id: dashboard-ui
title: "Dashboard: who owes who, how much, since when"
intent: family-ledger
complexity: medium
mode: confirm
status: in_progress
depends_on:
  - balance-engine
created: 2026-07-22T00:00:00Z
---

# Work Item: Dashboard: who owes who, how much, since when

## Description

The primary screen every family member sees: current balances per household, presented so the answer to "who owes who, how much, why, since when, has it been paid" is immediately visible without needing to ask.

## Acceptance Criteria

- [ ] Per-household view showing each member's current balance relative to others (or to the viewer, if that's the chosen granularity from the balance engine design)
- [ ] Each balance links to or expands into the contributing expenses/settlements ("why" and "since when")
- [ ] Admin can switch between the "Apartment" and "Family" household views
- [ ] Non-login members (Mama) appear correctly in the Family household view even though they never log in
- [ ] Works on mobile-width screens (responsive), since family members will likely check this from their phones
- [ ] Loads and renders the current balance for a household in well under 1 second at this data scale

## Technical Notes

- This is a read-heavy view calling the balance engine — no new domain logic here, just querying, aggregating for display, and presentation.
- Keep it simple for v1: numbers and a list of contributing transactions is enough. Charts/analytics are out of scope (deferred).

## Dependencies

- balance-engine

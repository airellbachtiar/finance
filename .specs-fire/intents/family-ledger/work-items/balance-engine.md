---
id: balance-engine
title: Balance engine (derive balances from the event log)
intent: family-ledger
complexity: high
mode: validate
status: pending
depends_on: [expense-model, settlement-model]
created: "2026-07-22T00:00:00Z"
---

# Work Item: Balance engine (derive balances from the event log)

## Description

The core correctness-critical piece of the app: a pure function that takes all expenses and settlements for a household and computes each member's current net position — who owes who, and how much — entirely from that history. No balance is ever read from or written to a stored "balance" field.

## Acceptance Criteria

- [ ] Given a household's full expense + settlement history, computes each member's net balance relative to every other member (or at minimum, net position relative to the household — confirm which granularity is needed during design)
- [ ] Handles equal splits correctly (e.g. €1800 rent 3-way → €600 each)
- [ ] Handles overridden per-expense splits correctly
- [ ] Handles multi-currency expenses (IDR converted to EUR) without precision/rounding bugs
- [ ] Applies settlements to reduce the balance between the two members involved, including partial and bulk/irregular settlements
- [ ] Produces the same result regardless of the order events are processed in (order-independent aggregation, not a running ledger that depends on sequence)
- [ ] Unit tests cover: equal split, overridden split, multi-currency expense, single settlement, bulk settlement clearing multiple months of accrued balance, mixed EUR/IDR history
- [ ] Result includes enough detail for the dashboard to answer "since when" (e.g. oldest unsettled expense date contributing to a balance)

## Technical Notes

- Because this determines actual money owed between real people, it goes through Validate mode: a design doc should be produced first covering the computation approach (e.g. pairwise net balances vs. household-relative net position) and rounding strategy, before implementation.
- This is a pure function with no database writes — it reads expense/settlement data and returns computed balances for the dashboard to render.

## Dependencies

- expense-model
- settlement-model

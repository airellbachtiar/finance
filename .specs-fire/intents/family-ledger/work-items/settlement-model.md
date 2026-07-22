---
id: settlement-model
title: Settlement recording (transfers between members)
intent: family-ledger
complexity: medium
mode: confirm
status: pending
depends_on: [household-member-model]
created: "2026-07-22T00:00:00Z"
---

# Work Item: Settlement recording (transfers between members)

## Description

Model a `Settlement` as a financial event that discharges an obligation: one member transferred money to another. Supports both routine settlements (e.g. a brother paying rent) and irregular bulk settlements (e.g. Mama sending €10,000 to reconcile several months at once).

## Acceptance Criteria

- [ ] `Settlement` model: household, from (Member), to (Member), amount, currency (default EUR), date, optional note
- [ ] Admin can record a settlement between any two members of the same household
- [ ] Basic CRUD UI: add settlement, list settlement history for a household, edit/delete a settlement
- [ ] A settlement is not tied to a specific expense — it reduces the overall net balance between the two members, matching how bulk parent reimbursements actually work

## Technical Notes

- No IBAN/QR/"mark as paid" UX in this work item — that's deferred (see intent brief notes). This item only records that a transfer happened once the user tells it to.
- Currency handling mirrors the expense model (store original + converted EUR amount) for consistency, even though most settlements are expected to be in EUR.

## Dependencies

- household-member-model

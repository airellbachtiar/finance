---
work_item: balance-engine
intent: family-ledger
created: "2026-07-22T18:05:00Z"
mode: validate
checkpoint_1: approved
---

# Design: Balance engine (derive balances from the event log)

## Summary

A pure function, `getHouseholdBalances(householdId)`, that reads a household's full `Expense`/`ExpenseSplit`/`Settlement` history and returns the net pairwise balance between every pair of members who have any outstanding balance — "who owes who, how much, since when." No balance is ever stored; this always recomputes from the event log.

## Scope

**In Scope:**
- Computing net **pairwise** balances (not just a single per-member number) — every member pair with a nonzero balance
- Handling expense splits (excluding the payer's own share, which isn't a debt to themselves)
- Handling settlements as debt-reducing events between the same two members
- Multi-currency correctness (all amounts already stored as EUR-converted `Decimal` by `expense-model`/`settlement-model` — the engine consumes `convertedAmountEur`, never re-converts)
- Order-independence: same result regardless of what order expenses/settlements are processed in
- A "since" date per pair, marking how far back that pair's activity goes
- Fixing a validation gap found while designing this: `createExpense`'s explicit-`splits` path doesn't currently verify each `memberId` belongs to the expense's household (the default equal-split path already does, implicitly, by only querying members of that household)

**Out of Scope:**
- Any UI (that's `dashboard-ui`, the next work item)
- Debt simplification (minimizing the number of transfers) — explicitly a "Future Idea" in the intent brief
- FIFO/chronological matching of which *specific* expense a settlement paid off (see Key Decisions — this is a deliberate simplification, not an oversight)

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Balance granularity | **Pairwise** net balance between every pair of members (not a single per-household net number per member) | The dashboard needs to say "Brother A owes you €420, Brother B owes you €165" — distinct numbers per relationship, which is exactly what the original spec's dashboard mock shows. A single per-member net number is strictly less information and would have to be reconstructed from pairwise data anyway for a multi-member household. |
| Representation | A signed net-debt map keyed by a canonical (sorted) member-pair, in integer cents | Avoids float drift; a single signed number per pair is the simplest structure that supports "netting" (an expense debt and a settlement in the same direction naturally cancel via addition, no separate reconciliation step needed). |
| How settlements interact with expense debts | A settlement is modeled as a debt in the **reverse** direction between the same two members, which nets directly against any accumulated expense-driven debt | If A owes B €600 (from an expense) and A pays B €600 (a settlement), recording "B owes A €600" (the reverse) and summing with the existing "A owes B €600" nets to exactly €0 — no special-casing needed, it falls out of plain signed addition. |
| "Since when" | The **oldest event date (expense or settlement) between that pair**, full stop — not "the oldest still-unpaid expense" | A true "oldest unpaid expense" requires deciding *which* expense a partial settlement paid off first (FIFO? LIFO? split proportionally?) — an arbitrary convention that would make the result depend on assumptions, not just facts. That directly conflicts with the acceptance criteria's own order-independence requirement. The simpler, honest answer — "this pair has had activity since date X" — is still genuinely useful ("you've had an open tab with Brother A since March") without pretending precision the data can't support. **Flagging this explicitly for your review** — if you'd rather have FIFO-matched "since," that's a bigger follow-up work item, not a small tweak. |
| Rounding | All arithmetic in `Decimal`/integer cents; a pair is considered settled (excluded from results) if its net rounds to exactly `0.00` | Consistent with `expense-model`'s remainder-cent handling — no floats anywhere in the money path. |
| Cross-household safety | Add explicit validation that every `memberId` referenced in an expense split belongs to the expense's household | Found while designing this: the *default* equal-split path only ever pulls members from the target household, but the *explicit*-splits path (used by direct API calls, not the current UI) never checked this — a caller could reference a member from a different household. Fixing now closes the same "no cross-household leakage" gap the acceptance criteria already requires elsewhere. |

## Data Models Affected

No new models. Reads `Expense`, `ExpenseSplit`, `Settlement`, `Member` as they exist today.

### Modifies

- **`lib/expenses.ts`**: `resolveSplits`'s explicit-`splits` branch gains a check that every `memberId` belongs to `householdId` (mirrors the check `lib/settlements.ts`'s `validateMembers` already does) — closes the cross-household gap above.

## Technical Approach

### Architecture

```
Expense + ExpenseSplit ──┐
                          ├──►  getHouseholdBalances(householdId)
       Settlement ────────┘             │
                                         │  1. Load all expenses+splits, all settlements
                                         │  2. For each split (member ≠ payer):
                                         │       applyDebt(member → payer, shareEur)
                                         │  3. For each settlement (from, to, amount):
                                         │       applyDebt(to → from, amount)   // reverses, nets against #2
                                         │  4. Round each pair to cents; drop pairs that net to 0
                                         ▼
                          PairBalance[] { debtorMemberId, creditorMemberId, amountEur, since }
                                         │
                                         ▼
                          (consumed by dashboard-ui — next work item, not built here)
```

**Worked example** (matches the intent brief's own numbers): Rent €1800, paid by you, split equally 3 ways (€600 each). Brother A's share (€600) and Brother B's share (€600) are debts to you; your own €600 share isn't a debt to yourself. Result before any settlement: `{debtor: BrotherA, creditor: You, amount: 600}`, `{debtor: BrotherB, creditor: You, amount: 600}`. Brother A then pays you €600 via a settlement (`from: BrotherA, to: You`) → applies as `applyDebt(You → BrotherA, 600)`, which nets the existing `600` down to `0` — that pair drops out of the result entirely. Brother B's €600 remains outstanding.

### API

- `getHouseholdBalances(householdId: string): Promise<PairBalance[]>`
  ```ts
  type PairBalance = {
    debtorMemberId: string
    creditorMemberId: string
    amountEur: Prisma.Decimal
    since: Date
  }
  ```

## Affected Files

| File | Action | Purpose |
|------|--------|---------|
| `lib/balance-engine.ts` | create | `getHouseholdBalances`, the pairwise-netting algorithm |
| `lib/balance-engine.test.ts` | create | Every acceptance-criteria scenario, plus order-independence |
| `lib/expenses.ts` | modify | Add household-membership validation to the explicit-splits path |
| `lib/expenses.test.ts` | modify | Add a test: explicit split referencing a member from a different household is rejected |

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| "Since" semantics (oldest activity, not oldest unpaid expense) could read as more precise than it is | Medium — could mislead about exactly which expense is "still owed" | Called out explicitly above for your sign-off; dashboard-ui (next work item) should phrase this as "activity since X," not "unpaid since X" |
| Rounding at the pair level could theoretically let a household's total split-cents not perfectly reconcile in extreme edge cases (many tiny expenses) | Low — each expense's own splits already always sum exactly (guaranteed by `expense-model`); only the final pairwise aggregation rounds, and only for display | Test with a large synthetic history (dozens of expenses) to confirm aggregate consistency, not just single-expense cases |
| Explicit-splits cross-household gap (found during design) | Medium if ever exploited — not reachable from the current UI, but reachable via direct API call | Fixed as part of this work item (see Key Decisions) |

## Implementation Checklist

- [ ] Add household-membership validation to `lib/expenses.ts`'s explicit-splits path; add the corresponding test
- [ ] Implement `applyDebt`/pairwise netting core in `lib/balance-engine.ts`
- [ ] Implement `getHouseholdBalances(householdId)` — load data, apply expenses then settlements, round, filter zero-net pairs
- [ ] Test: equal split (€1800/3 → €600 each)
- [ ] Test: overridden/subset split
- [ ] Test: multi-currency expense (IDR) feeds correctly into the balance (via its already-converted `convertedAmountEur`)
- [ ] Test: single settlement fully cancels a matching expense debt
- [ ] Test: bulk settlement clears several months of accrued balance in one go
- [ ] Test: mixed EUR/IDR history nets correctly
- [ ] Test: order-independence — same events in different insertion order produce the identical result
- [ ] Test: a household with zero net between two members doesn't appear in the result at all

---
*Checkpoint 1 approved: 2026-07-22T18:10:00Z*

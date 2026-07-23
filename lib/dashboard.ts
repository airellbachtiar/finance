import { Prisma, Expense, ExpenseSplit, Settlement } from '@prisma/client'
import { getHouseholdLedger } from './ledger'

export type PairEvent = {
  type: 'expense' | 'settlement'
  date: Date
  description: string
  amountEur: Prisma.Decimal
  fromMemberId: string
  toMemberId: string
}

type ExpenseWithSplits = Expense & { splits: ExpenseSplit[] }

/**
 * Pure computation: every expense-share and settlement between exactly two
 * members, chronologically, given an already-fetched household history. No
 * DB access — lets the dashboard derive every balance's history from one
 * shared fetch instead of a query per pair.
 */
export function derivePairHistory(
  expenses: ExpenseWithSplits[],
  settlements: Settlement[],
  memberIdA: string,
  memberIdB: string
): PairEvent[] {
  const events: PairEvent[] = []

  for (const expense of expenses) {
    const involvesPair =
      (expense.payerId === memberIdA && expense.splits.some((s) => s.memberId === memberIdB)) ||
      (expense.payerId === memberIdB && expense.splits.some((s) => s.memberId === memberIdA))
    if (!involvesPair) continue

    const owerId = expense.payerId === memberIdA ? memberIdB : memberIdA
    const split = expense.splits.find((s) => s.memberId === owerId)
    if (!split) continue
    events.push({
      type: 'expense',
      date: expense.date,
      description: expense.category,
      amountEur: split.shareEur,
      fromMemberId: owerId,
      toMemberId: expense.payerId,
    })
  }

  for (const settlement of settlements) {
    const involvesPair =
      (settlement.fromMemberId === memberIdA && settlement.toMemberId === memberIdB) ||
      (settlement.fromMemberId === memberIdB && settlement.toMemberId === memberIdA)
    if (!involvesPair) continue

    events.push({
      type: 'settlement',
      date: settlement.date,
      description: settlement.notes ?? 'Settlement',
      amountEur: settlement.convertedAmountEur,
      fromMemberId: settlement.fromMemberId,
      toMemberId: settlement.toMemberId,
    })
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime())
}

/**
 * Every expense-share and settlement between exactly two members,
 * chronologically, each tagged with who owed/paid whom. This is the "why"
 * behind a balance-engine pairwise balance.
 */
export async function getPairHistory(
  householdId: string,
  memberIdA: string,
  memberIdB: string
): Promise<PairEvent[]> {
  const { expenses, settlements } = await getHouseholdLedger(householdId)
  return derivePairHistory(expenses, settlements, memberIdA, memberIdB)
}

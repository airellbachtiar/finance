import { Prisma } from '@prisma/client'
import { prisma } from './db'

export type PairEvent = {
  type: 'expense' | 'settlement'
  date: Date
  description: string
  amountEur: Prisma.Decimal
  fromMemberId: string
  toMemberId: string
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
  const [expenses, settlements] = await Promise.all([
    prisma.expense.findMany({
      where: {
        householdId,
        OR: [
          { payerId: memberIdA, splits: { some: { memberId: memberIdB } } },
          { payerId: memberIdB, splits: { some: { memberId: memberIdA } } },
        ],
      },
      include: { splits: true },
    }),
    prisma.settlement.findMany({
      where: {
        householdId,
        OR: [
          { fromMemberId: memberIdA, toMemberId: memberIdB },
          { fromMemberId: memberIdB, toMemberId: memberIdA },
        ],
      },
    }),
  ])

  const events: PairEvent[] = []

  for (const expense of expenses) {
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

import { Prisma } from '@prisma/client'
import { prisma } from './db'

export type PairBalance = {
  debtorMemberId: string
  creditorMemberId: string
  amountEur: Prisma.Decimal
  since: Date
}

type PairState = {
  netCents: Prisma.Decimal // positive => "b" (the lexicographically larger id) owes "a"
  since: Date
}

function pairKey(a: string, b: string): [string, string, string] {
  const [lo, hi] = a < b ? [a, b] : [b, a]
  return [`${lo}|${hi}`, lo, hi]
}

function applyDebt(
  net: Map<string, PairState>,
  debtorId: string,
  creditorId: string,
  amountEur: Prisma.Decimal,
  date: Date
) {
  const [key, , hi] = pairKey(debtorId, creditorId)
  const amountCents = amountEur.mul(100)
  const delta = debtorId === hi ? amountCents : amountCents.negated()

  const existing = net.get(key)
  if (existing) {
    existing.netCents = existing.netCents.plus(delta)
    if (date < existing.since) existing.since = date
  } else {
    net.set(key, { netCents: delta, since: date })
  }
}

/**
 * Computes the net pairwise balance between every pair of members in a
 * household, derived entirely from its expense and settlement history.
 * Never reads or writes a stored "balance" — always recomputed.
 */
export async function getHouseholdBalances(householdId: string): Promise<PairBalance[]> {
  const [expenses, settlements] = await Promise.all([
    prisma.expense.findMany({
      where: { householdId },
      include: { splits: true },
    }),
    prisma.settlement.findMany({ where: { householdId } }),
  ])

  const net = new Map<string, PairState>()

  for (const expense of expenses) {
    for (const split of expense.splits) {
      if (split.memberId === expense.payerId) continue // no debt to yourself
      applyDebt(net, split.memberId, expense.payerId, split.shareEur, expense.date)
    }
  }

  for (const settlement of settlements) {
    // Paying someone nets against a debt in the opposite direction: record
    // it as the recipient (reverse-)owing the payer, which cancels out.
    applyDebt(
      net,
      settlement.toMemberId,
      settlement.fromMemberId,
      settlement.convertedAmountEur,
      settlement.date
    )
  }

  const results: PairBalance[] = []
  for (const [key, state] of Array.from(net.entries())) {
    const [lo, hi] = key.split('|')
    const amountCents = state.netCents.toDecimalPlaces(0)
    if (amountCents.isZero()) continue

    const amountEur = amountCents.abs().dividedBy(100)
    // netCents > 0 means "hi" owes "lo"; netCents < 0 means "lo" owes "hi"
    const [debtorMemberId, creditorMemberId] = amountCents.isPositive() ? [hi, lo] : [lo, hi]

    results.push({ debtorMemberId, creditorMemberId, amountEur, since: state.since })
  }

  return results
}

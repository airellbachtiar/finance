import { prisma } from './db'

/**
 * Fetches a household's full expense (with splits) and settlement history
 * in exactly two queries. Shared by getHouseholdBalances and getPairHistory
 * so the dashboard can compute both from one fetch instead of re-querying
 * per balance pair.
 */
export async function getHouseholdLedger(householdId: string) {
  const [expenses, settlements] = await Promise.all([
    prisma.expense.findMany({
      where: { householdId },
      include: { splits: true },
    }),
    prisma.settlement.findMany({ where: { householdId } }),
  ])
  return { expenses, settlements }
}

export type HouseholdLedger = Awaited<ReturnType<typeof getHouseholdLedger>>

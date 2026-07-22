import { describe, it, expect, afterEach } from 'vitest'
import { prisma } from './db'
import { createHousehold, addNonLoginMember } from './households'
import { createExpense } from './expenses'
import { createSettlement } from './settlements'
import { getHouseholdBalances } from './balance-engine'

const createdHouseholdIds: string[] = []
const createdUserIds: string[] = []

afterEach(async () => {
  await prisma.settlement.deleteMany({ where: { householdId: { in: createdHouseholdIds } } })
  await prisma.expenseSplit.deleteMany({
    where: { expense: { householdId: { in: createdHouseholdIds } } },
  })
  await prisma.expense.deleteMany({ where: { householdId: { in: createdHouseholdIds } } })
  await prisma.member.deleteMany({ where: { householdId: { in: createdHouseholdIds } } })
  await prisma.household.deleteMany({ where: { id: { in: createdHouseholdIds } } })
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } })
  createdHouseholdIds.length = 0
  createdUserIds.length = 0
})

async function makeUser(email: string) {
  const user = await prisma.user.create({ data: { email } })
  createdUserIds.push(user.id)
  return user
}

function findBalance(balances: Awaited<ReturnType<typeof getHouseholdBalances>>, debtorId: string, creditorId: string) {
  return balances.find((b) => b.debtorMemberId === debtorId && b.creditorMemberId === creditorId)
}

describe('getHouseholdBalances', () => {
  it('handles the intent brief\'s worked example: rent split 3 ways, one brother settles in full', async () => {
    const user = await makeUser('vitest-balance-1@example.com')
    const household = await createHousehold('Apartment', user.id, 'You')
    createdHouseholdIds.push(household.id)
    const brotherA = await addNonLoginMember(household.id, 'Brother A')
    const brotherB = await addNonLoginMember(household.id, 'Brother B')
    const you = await prisma.member.findFirstOrThrow({
      where: { householdId: household.id, userId: user.id },
    })

    await createExpense({
      householdId: household.id,
      payerId: you.id,
      date: new Date('2026-07-01'),
      category: 'Rent',
      originalCurrency: 'EUR',
      originalAmount: 1800,
    })

    await createSettlement({
      householdId: household.id,
      fromMemberId: brotherA.id,
      toMemberId: you.id,
      date: new Date('2026-07-05'),
      originalCurrency: 'EUR',
      originalAmount: 600,
    })

    const balances = await getHouseholdBalances(household.id)

    expect(findBalance(balances, brotherA.id, you.id)).toBeUndefined()
    const bBalance = findBalance(balances, brotherB.id, you.id)
    expect(bBalance?.amountEur.toString()).toBe('600')
  })

  it('handles an overridden/subset split', async () => {
    const user = await makeUser('vitest-balance-2@example.com')
    const household = await createHousehold('Apartment', user.id, 'You')
    createdHouseholdIds.push(household.id)
    const brotherA = await addNonLoginMember(household.id, 'Brother A')
    await addNonLoginMember(household.id, 'Brother B (away)')
    const you = await prisma.member.findFirstOrThrow({
      where: { householdId: household.id, userId: user.id },
    })

    await createExpense({
      householdId: household.id,
      payerId: you.id,
      date: new Date('2026-07-01'),
      category: 'Groceries',
      originalCurrency: 'EUR',
      originalAmount: 50,
      memberIds: [you.id, brotherA.id],
    })

    const balances = await getHouseholdBalances(household.id)
    expect(balances).toHaveLength(1)
    expect(findBalance(balances, brotherA.id, you.id)?.amountEur.toString()).toBe('25')
  })

  it('correctly incorporates a multi-currency (IDR) expense', async () => {
    const user = await makeUser('vitest-balance-3@example.com')
    const household = await createHousehold('Family', user.id, 'You')
    createdHouseholdIds.push(household.id)
    const mama = await addNonLoginMember(household.id, 'Mama')
    const you = await prisma.member.findFirstOrThrow({
      where: { householdId: household.id, userId: user.id },
    })

    await createExpense({
      householdId: household.id,
      payerId: you.id,
      date: new Date('2026-07-01'),
      category: 'Groceries (Indonesia)',
      originalCurrency: 'IDR',
      originalAmount: 2500000,
      exchangeRate: 18500,
      memberIds: [you.id, mama.id],
    })

    const balances = await getHouseholdBalances(household.id)
    // 135.14 total / 2 members = 67.57 each
    expect(findBalance(balances, mama.id, you.id)?.amountEur.toString()).toBe('67.57')
  })

  it('a bulk settlement clears several months of accrued balance in one go', async () => {
    const user = await makeUser('vitest-balance-4@example.com')
    const household = await createHousehold('Family', user.id, 'You')
    createdHouseholdIds.push(household.id)
    const mama = await addNonLoginMember(household.id, 'Mama')
    const you = await prisma.member.findFirstOrThrow({
      where: { householdId: household.id, userId: user.id },
    })

    for (const month of [1, 2, 3]) {
      await createExpense({
        householdId: household.id,
        payerId: you.id,
        date: new Date(`2026-0${month}-01`),
        category: 'Parent expenses',
        originalCurrency: 'EUR',
        originalAmount: 3000,
        memberIds: [mama.id],
      })
    }

    await createSettlement({
      householdId: household.id,
      fromMemberId: mama.id,
      toMemberId: you.id,
      date: new Date('2026-04-01'),
      originalCurrency: 'EUR',
      originalAmount: 10000,
      notes: 'Bulk reimbursement',
    })

    const balances = await getHouseholdBalances(household.id)
    // 9000 owed, 10000 paid -> now Mama has a 1000 credit (you owe her)
    expect(findBalance(balances, you.id, mama.id)?.amountEur.toString()).toBe('1000')
  })

  it('produces the same result regardless of event processing order', async () => {
    const user = await makeUser('vitest-balance-5@example.com')
    const household = await createHousehold('Apartment', user.id, 'You')
    createdHouseholdIds.push(household.id)
    const brotherA = await addNonLoginMember(household.id, 'Brother A')
    const you = await prisma.member.findFirstOrThrow({
      where: { householdId: household.id, userId: user.id },
    })

    // Create settlement BEFORE the expense it will partially offset —
    // the engine reads everything at once regardless of DB insertion order.
    await createSettlement({
      householdId: household.id,
      fromMemberId: brotherA.id,
      toMemberId: you.id,
      date: new Date('2026-07-10'),
      originalCurrency: 'EUR',
      originalAmount: 200,
    })
    await createExpense({
      householdId: household.id,
      payerId: you.id,
      date: new Date('2026-07-01'),
      category: 'Utilities',
      originalCurrency: 'EUR',
      originalAmount: 500,
      memberIds: [brotherA.id],
    })

    const balances = await getHouseholdBalances(household.id)
    expect(findBalance(balances, brotherA.id, you.id)?.amountEur.toString()).toBe('300')
  })

  it('excludes pairs whose net balance is exactly zero', async () => {
    const user = await makeUser('vitest-balance-6@example.com')
    const household = await createHousehold('Apartment', user.id, 'You')
    createdHouseholdIds.push(household.id)
    const brotherA = await addNonLoginMember(household.id, 'Brother A')
    const you = await prisma.member.findFirstOrThrow({
      where: { householdId: household.id, userId: user.id },
    })

    await createExpense({
      householdId: household.id,
      payerId: you.id,
      date: new Date('2026-07-01'),
      category: 'Utilities',
      originalCurrency: 'EUR',
      originalAmount: 100,
      memberIds: [brotherA.id],
    })
    await createSettlement({
      householdId: household.id,
      fromMemberId: brotherA.id,
      toMemberId: you.id,
      date: new Date('2026-07-05'),
      originalCurrency: 'EUR',
      originalAmount: 100,
    })

    const balances = await getHouseholdBalances(household.id)
    expect(balances).toHaveLength(0)
  })

  it('tracks "since" as the oldest event date between a pair', async () => {
    const user = await makeUser('vitest-balance-7@example.com')
    const household = await createHousehold('Apartment', user.id, 'You')
    createdHouseholdIds.push(household.id)
    const brotherA = await addNonLoginMember(household.id, 'Brother A')
    const you = await prisma.member.findFirstOrThrow({
      where: { householdId: household.id, userId: user.id },
    })

    await createExpense({
      householdId: household.id,
      payerId: you.id,
      date: new Date('2026-05-01'),
      category: 'Rent',
      originalCurrency: 'EUR',
      originalAmount: 100,
      memberIds: [brotherA.id],
    })
    await createExpense({
      householdId: household.id,
      payerId: you.id,
      date: new Date('2026-06-01'),
      category: 'Rent',
      originalCurrency: 'EUR',
      originalAmount: 100,
      memberIds: [brotherA.id],
    })

    const balances = await getHouseholdBalances(household.id)
    const balance = findBalance(balances, brotherA.id, you.id)
    expect(balance?.since.toISOString().slice(0, 10)).toBe('2026-05-01')
  })
})

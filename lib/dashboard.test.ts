import { describe, it, expect, afterEach } from 'vitest'
import { prisma } from './db'
import { createHousehold, addNonLoginMember } from './households'
import { createExpense } from './expenses'
import { createSettlement } from './settlements'
import { getPairHistory } from './dashboard'

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

describe('getPairHistory', () => {
  it('includes an expense share, correctly tagged ower -> payer', async () => {
    const user = await makeUser('vitest-dashboard-1@example.com')
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
      category: 'Rent',
      originalCurrency: 'EUR',
      originalAmount: 100,
      memberIds: [brotherA.id],
    })

    const history = await getPairHistory(household.id, you.id, brotherA.id)
    expect(history).toHaveLength(1)
    expect(history[0]).toMatchObject({
      type: 'expense',
      description: 'Rent',
      fromMemberId: brotherA.id,
      toMemberId: you.id,
    })
    expect(history[0].amountEur.toString()).toBe('100')
  })

  it('includes a settlement, tagged from -> to as recorded', async () => {
    const user = await makeUser('vitest-dashboard-2@example.com')
    const household = await createHousehold('Family', user.id, 'You')
    createdHouseholdIds.push(household.id)
    const mama = await addNonLoginMember(household.id, 'Mama')
    const you = await prisma.member.findFirstOrThrow({
      where: { householdId: household.id, userId: user.id },
    })

    await createSettlement({
      householdId: household.id,
      fromMemberId: mama.id,
      toMemberId: you.id,
      date: new Date('2026-07-05'),
      originalCurrency: 'EUR',
      originalAmount: 10000,
      notes: 'Bulk reimbursement',
    })

    const history = await getPairHistory(household.id, you.id, mama.id)
    expect(history).toHaveLength(1)
    expect(history[0]).toMatchObject({
      type: 'settlement',
      description: 'Bulk reimbursement',
      fromMemberId: mama.id,
      toMemberId: you.id,
    })
  })

  it('excludes events involving a third member', async () => {
    const user = await makeUser('vitest-dashboard-3@example.com')
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
      originalAmount: 90,
      memberIds: [brotherA.id, brotherB.id],
    })

    const history = await getPairHistory(household.id, you.id, brotherA.id)
    expect(history).toHaveLength(1)
    expect(history[0].fromMemberId).toBe(brotherA.id)
  })

  it('returns events in chronological order', async () => {
    const user = await makeUser('vitest-dashboard-4@example.com')
    const household = await createHousehold('Apartment', user.id, 'You')
    createdHouseholdIds.push(household.id)
    const brotherA = await addNonLoginMember(household.id, 'Brother A')
    const you = await prisma.member.findFirstOrThrow({
      where: { householdId: household.id, userId: user.id },
    })

    await createExpense({
      householdId: household.id,
      payerId: you.id,
      date: new Date('2026-06-01'),
      category: 'June rent',
      originalCurrency: 'EUR',
      originalAmount: 100,
      memberIds: [brotherA.id],
    })
    await createExpense({
      householdId: household.id,
      payerId: you.id,
      date: new Date('2026-05-01'),
      category: 'May rent',
      originalCurrency: 'EUR',
      originalAmount: 100,
      memberIds: [brotherA.id],
    })

    const history = await getPairHistory(household.id, you.id, brotherA.id)
    expect(history.map((h) => h.description)).toEqual(['May rent', 'June rent'])
  })
})

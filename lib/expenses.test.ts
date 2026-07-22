import { describe, it, expect, afterEach } from 'vitest'
import { Prisma } from '@prisma/client'
import { prisma } from './db'
import { createHousehold, addNonLoginMember } from './households'
import { createExpense, updateExpense, deleteExpense } from './expenses'

const createdHouseholdIds: string[] = []
const createdUserIds: string[] = []

afterEach(async () => {
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

describe('expenses', () => {
  it('splits an expense equally among all household members, distributing the remainder cent', async () => {
    const user = await makeUser('vitest-expense-1@example.com')
    const household = await createHousehold('Apartment', user.id, 'Admin')
    createdHouseholdIds.push(household.id)
    await addNonLoginMember(household.id, 'Brother B')
    await addNonLoginMember(household.id, 'Brother C')
    const admin = await prisma.member.findFirstOrThrow({
      where: { householdId: household.id, userId: user.id },
    })

    const expense = await createExpense({
      householdId: household.id,
      payerId: admin.id,
      date: new Date('2026-07-01'),
      category: 'Rent',
      originalCurrency: 'EUR',
      originalAmount: 100,
    })

    const shares = expense.splits.map((s) => s.shareEur.toString()).sort()
    expect(shares).toEqual(['33.33', '33.33', '33.34'])

    const total = expense.splits.reduce(
      (acc, s) => acc.plus(s.shareEur),
      new Prisma.Decimal(0)
    )
    expect(total.toString()).toBe('100')
  })

  it('splits only among an explicit subset of members', async () => {
    const user = await makeUser('vitest-expense-2@example.com')
    const household = await createHousehold('Apartment', user.id, 'Admin')
    createdHouseholdIds.push(household.id)
    const b = await addNonLoginMember(household.id, 'Brother B')
    await addNonLoginMember(household.id, 'Brother C (away)')
    const admin = await prisma.member.findFirstOrThrow({
      where: { householdId: household.id, userId: user.id },
    })

    const expense = await createExpense({
      householdId: household.id,
      payerId: admin.id,
      date: new Date('2026-07-01'),
      category: 'Groceries',
      originalCurrency: 'EUR',
      originalAmount: 50,
      memberIds: [admin.id, b.id],
    })

    expect(expense.splits).toHaveLength(2)
    const shares = expense.splits.map((s) => s.shareEur.toString()).sort()
    expect(shares).toEqual(['25', '25'])
  })

  it('accepts explicit splits that sum exactly to the total', async () => {
    const user = await makeUser('vitest-expense-3@example.com')
    const household = await createHousehold('Apartment', user.id, 'Admin')
    createdHouseholdIds.push(household.id)
    const admin = await prisma.member.findFirstOrThrow({
      where: { householdId: household.id, userId: user.id },
    })

    const expense = await createExpense({
      householdId: household.id,
      payerId: admin.id,
      date: new Date('2026-07-01'),
      category: 'Utilities',
      originalCurrency: 'EUR',
      originalAmount: 60,
      splits: [{ memberId: admin.id, shareEur: 60 }],
    })

    expect(expense.splits[0].shareEur.toString()).toBe('60')
  })

  it('rejects explicit splits that do not sum to the total', async () => {
    const user = await makeUser('vitest-expense-4@example.com')
    const household = await createHousehold('Apartment', user.id, 'Admin')
    createdHouseholdIds.push(household.id)
    const admin = await prisma.member.findFirstOrThrow({
      where: { householdId: household.id, userId: user.id },
    })

    await expect(
      createExpense({
        householdId: household.id,
        payerId: admin.id,
        date: new Date('2026-07-01'),
        category: 'Utilities',
        originalCurrency: 'EUR',
        originalAmount: 60,
        splits: [{ memberId: admin.id, shareEur: 50 }],
      })
    ).rejects.toThrow('Splits must sum to the expense total')
  })

  it('converts non-EUR expenses and stores the original alongside the converted amount', async () => {
    const user = await makeUser('vitest-expense-5@example.com')
    const household = await createHousehold('Family', user.id, 'Admin')
    createdHouseholdIds.push(household.id)
    const admin = await prisma.member.findFirstOrThrow({
      where: { householdId: household.id, userId: user.id },
    })

    const expense = await createExpense({
      householdId: household.id,
      payerId: admin.id,
      date: new Date('2026-07-01'),
      category: 'Groceries (Indonesia)',
      originalCurrency: 'IDR',
      originalAmount: 2500000,
      exchangeRate: 18500,
    })

    expect(expense.originalCurrency).toBe('IDR')
    expect(expense.originalAmount.toString()).toBe('2500000')
    expect(expense.convertedAmountEur.toString()).toBe('135.14')
  })

  it('updating an expense recomputes conversion and splits', async () => {
    const user = await makeUser('vitest-expense-6@example.com')
    const household = await createHousehold('Apartment', user.id, 'Admin')
    createdHouseholdIds.push(household.id)
    const admin = await prisma.member.findFirstOrThrow({
      where: { householdId: household.id, userId: user.id },
    })

    const expense = await createExpense({
      householdId: household.id,
      payerId: admin.id,
      date: new Date('2026-07-01'),
      category: 'Rent',
      originalCurrency: 'EUR',
      originalAmount: 100,
      memberIds: [admin.id],
    })

    const updated = await updateExpense(expense.id, {
      householdId: household.id,
      payerId: admin.id,
      date: new Date('2026-07-02'),
      category: 'Rent (corrected)',
      originalCurrency: 'EUR',
      originalAmount: 120,
      memberIds: [admin.id],
    })

    expect(updated.category).toBe('Rent (corrected)')
    expect(updated.convertedAmountEur.toString()).toBe('120')
    expect(updated.splits).toHaveLength(1)
    expect(updated.splits[0].shareEur.toString()).toBe('120')
  })

  it('deleting an expense removes its splits too', async () => {
    const user = await makeUser('vitest-expense-7@example.com')
    const household = await createHousehold('Apartment', user.id, 'Admin')
    createdHouseholdIds.push(household.id)
    const admin = await prisma.member.findFirstOrThrow({
      where: { householdId: household.id, userId: user.id },
    })

    const expense = await createExpense({
      householdId: household.id,
      payerId: admin.id,
      date: new Date('2026-07-01'),
      category: 'Rent',
      originalCurrency: 'EUR',
      originalAmount: 100,
      memberIds: [admin.id],
    })

    await deleteExpense(expense.id)

    const remainingSplits = await prisma.expenseSplit.findMany({ where: { expenseId: expense.id } })
    expect(remainingSplits).toHaveLength(0)
  })
})

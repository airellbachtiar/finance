import { describe, it, expect, afterEach } from 'vitest'
import { prisma } from './db'
import { createHousehold, addNonLoginMember } from './households'
import { createSettlement, updateSettlement, deleteSettlement } from './settlements'

const createdHouseholdIds: string[] = []
const createdUserIds: string[] = []

afterEach(async () => {
  await prisma.settlement.deleteMany({ where: { householdId: { in: createdHouseholdIds } } })
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

describe('settlements', () => {
  it('records a settlement between two members of the same household', async () => {
    const user = await makeUser('vitest-settlement-1@example.com')
    const household = await createHousehold('Family', user.id, 'Admin')
    createdHouseholdIds.push(household.id)
    const mama = await addNonLoginMember(household.id, 'Mama')
    const admin = await prisma.member.findFirstOrThrow({
      where: { householdId: household.id, userId: user.id },
    })

    const settlement = await createSettlement({
      householdId: household.id,
      fromMemberId: mama.id,
      toMemberId: admin.id,
      date: new Date('2026-07-01'),
      originalCurrency: 'EUR',
      originalAmount: 10000,
      notes: 'Bulk reimbursement covering several months',
    })

    expect(settlement.convertedAmountEur.toString()).toBe('10000')
    expect(settlement.fromMemberId).toBe(mama.id)
    expect(settlement.toMemberId).toBe(admin.id)
  })

  it('rejects a member settling with themselves', async () => {
    const user = await makeUser('vitest-settlement-2@example.com')
    const household = await createHousehold('Apartment', user.id, 'Admin')
    createdHouseholdIds.push(household.id)
    const admin = await prisma.member.findFirstOrThrow({
      where: { householdId: household.id, userId: user.id },
    })

    await expect(
      createSettlement({
        householdId: household.id,
        fromMemberId: admin.id,
        toMemberId: admin.id,
        date: new Date('2026-07-01'),
        originalCurrency: 'EUR',
        originalAmount: 100,
      })
    ).rejects.toThrow('cannot settle with themselves')
  })

  it('rejects a member from a different household', async () => {
    const user1 = await makeUser('vitest-settlement-3a@example.com')
    const user2 = await makeUser('vitest-settlement-3b@example.com')
    const household1 = await createHousehold('Apartment', user1.id, 'Admin 1')
    const household2 = await createHousehold('Family', user2.id, 'Admin 2')
    createdHouseholdIds.push(household1.id, household2.id)

    const member1 = await prisma.member.findFirstOrThrow({
      where: { householdId: household1.id, userId: user1.id },
    })
    const member2 = await prisma.member.findFirstOrThrow({
      where: { householdId: household2.id, userId: user2.id },
    })

    await expect(
      createSettlement({
        householdId: household1.id,
        fromMemberId: member1.id,
        toMemberId: member2.id,
        date: new Date('2026-07-01'),
        originalCurrency: 'EUR',
        originalAmount: 100,
      })
    ).rejects.toThrow('must belong to the settlement')
  })

  it('converts non-EUR settlements and stores both amounts', async () => {
    const user = await makeUser('vitest-settlement-4@example.com')
    const household = await createHousehold('Family', user.id, 'Admin')
    createdHouseholdIds.push(household.id)
    const mama = await addNonLoginMember(household.id, 'Mama')
    const admin = await prisma.member.findFirstOrThrow({
      where: { householdId: household.id, userId: user.id },
    })

    const settlement = await createSettlement({
      householdId: household.id,
      fromMemberId: mama.id,
      toMemberId: admin.id,
      date: new Date('2026-07-01'),
      originalCurrency: 'IDR',
      originalAmount: 2500000,
      exchangeRate: 18500,
    })

    expect(settlement.originalCurrency).toBe('IDR')
    expect(settlement.originalAmount.toString()).toBe('2500000')
    expect(settlement.convertedAmountEur.toString()).toBe('135.14')
  })

  it('updates a settlement, recomputing conversion', async () => {
    const user = await makeUser('vitest-settlement-5@example.com')
    const household = await createHousehold('Apartment', user.id, 'Admin')
    createdHouseholdIds.push(household.id)
    const brother = await addNonLoginMember(household.id, 'Brother')
    const admin = await prisma.member.findFirstOrThrow({
      where: { householdId: household.id, userId: user.id },
    })

    const settlement = await createSettlement({
      householdId: household.id,
      fromMemberId: brother.id,
      toMemberId: admin.id,
      date: new Date('2026-07-01'),
      originalCurrency: 'EUR',
      originalAmount: 500,
    })

    const updated = await updateSettlement(settlement.id, {
      householdId: household.id,
      fromMemberId: brother.id,
      toMemberId: admin.id,
      date: new Date('2026-07-02'),
      originalCurrency: 'EUR',
      originalAmount: 600,
      notes: 'Corrected amount',
    })

    expect(updated.convertedAmountEur.toString()).toBe('600')
    expect(updated.notes).toBe('Corrected amount')
  })

  it('deletes a settlement', async () => {
    const user = await makeUser('vitest-settlement-6@example.com')
    const household = await createHousehold('Apartment', user.id, 'Admin')
    createdHouseholdIds.push(household.id)
    const brother = await addNonLoginMember(household.id, 'Brother')
    const admin = await prisma.member.findFirstOrThrow({
      where: { householdId: household.id, userId: user.id },
    })

    const settlement = await createSettlement({
      householdId: household.id,
      fromMemberId: brother.id,
      toMemberId: admin.id,
      date: new Date('2026-07-01'),
      originalCurrency: 'EUR',
      originalAmount: 500,
    })

    await deleteSettlement(settlement.id)

    const found = await prisma.settlement.findUnique({ where: { id: settlement.id } })
    expect(found).toBeNull()
  })
})

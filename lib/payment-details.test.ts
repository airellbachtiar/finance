import { describe, it, expect, afterEach } from 'vitest'
import { prisma } from './db'
import { createHousehold, addNonLoginMember } from './households'
import { getPaymentDetails } from './payment-details'

const createdHouseholdIds: string[] = []
const createdUserIds: string[] = []

afterEach(async () => {
  await prisma.member.deleteMany({ where: { householdId: { in: createdHouseholdIds } } })
  await prisma.household.deleteMany({ where: { id: { in: createdHouseholdIds } } })
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } })
  createdHouseholdIds.length = 0
  createdUserIds.length = 0
})

async function makeUser(email: string, iban?: string) {
  const user = await prisma.user.create({ data: { email, iban } })
  createdUserIds.push(user.id)
  return user
}

describe('getPaymentDetails', () => {
  it('returns null when the creditor has no IBAN on file', async () => {
    const user = await makeUser('vitest-pay-1@example.com')
    const household = await createHousehold('Apartment', user.id, 'You')
    createdHouseholdIds.push(household.id)
    const you = household.members[0]

    const result = await getPaymentDetails(household.id, you.id, '100', household.name)
    expect(result).toBeNull()
  })

  it('returns payment details for a login member, sourced from their User.iban', async () => {
    const user = await makeUser('vitest-pay-2@example.com', 'NL91ABNA0417164300')
    const household = await createHousehold('Apartment', user.id, 'You')
    createdHouseholdIds.push(household.id)
    const you = household.members[0]

    const result = await getPaymentDetails(household.id, you.id, '150.50', household.name)
    expect(result).not.toBeNull()
    expect(result?.iban).toBe('NL91ABNA0417164300')
    expect(result?.beneficiaryName).toBe('You')
    expect(result?.amountEur).toBe('150.50')
    expect(result?.reference).toContain('Apartment')
    expect(result?.qrDataUrl.startsWith('data:image/')).toBe(true)
  })

  it('returns payment details for a non-login member, sourced from Member.iban', async () => {
    const user = await makeUser('vitest-pay-3@example.com')
    const household = await createHousehold('Family', user.id, 'Admin')
    createdHouseholdIds.push(household.id)
    const mama = await addNonLoginMember(household.id, 'Mama')
    await prisma.member.update({ where: { id: mama.id }, data: { iban: 'NL02ABNA0123456789' } })

    const result = await getPaymentDetails(household.id, mama.id, '500', household.name)
    expect(result?.iban).toBe('NL02ABNA0123456789')
    expect(result?.beneficiaryName).toBe('Mama')
  })

  it('returns null for a member from a different household', async () => {
    const user1 = await makeUser('vitest-pay-4a@example.com', 'NL91ABNA0417164300')
    const user2 = await makeUser('vitest-pay-4b@example.com')
    const household1 = await createHousehold('Apartment', user1.id, 'Admin 1')
    const household2 = await createHousehold('Family', user2.id, 'Admin 2')
    createdHouseholdIds.push(household1.id, household2.id)

    const member1 = household1.members[0]
    const result = await getPaymentDetails(household2.id, member1.id, '100', household2.name)
    expect(result).toBeNull()
  })
})

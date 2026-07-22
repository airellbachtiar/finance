import { describe, it, expect, afterEach } from 'vitest'
import { prisma } from './db'
import {
  createHousehold,
  isHouseholdAdmin,
  isHouseholdMember,
  inviteMember,
  addNonLoginMember,
  removeMember,
} from './households'

const createdHouseholdIds: string[] = []
const createdUserIds: string[] = []

afterEach(async () => {
  await prisma.member.deleteMany({ where: { householdId: { in: createdHouseholdIds } } })
  await prisma.invite.deleteMany({ where: { householdId: { in: createdHouseholdIds } } })
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

describe('households', () => {
  it('creates a household with the creator as admin', async () => {
    const user = await makeUser('vitest-household-creator@example.com')
    const household = await createHousehold('Apartment', user.id, 'Admin User')
    createdHouseholdIds.push(household.id)

    expect(await isHouseholdAdmin(user.id, household.id)).toBe(true)
    expect(await isHouseholdMember(user.id, household.id)).toBe(true)
  })

  it('creates a household-scoped invite for a login member', async () => {
    const user = await makeUser('vitest-household-admin@example.com')
    const household = await createHousehold('Family', user.id, 'Admin User')
    createdHouseholdIds.push(household.id)

    const invite = await inviteMember(household.id, 'vitest-household-invitee@example.com')
    expect(invite.householdId).toBe(household.id)

    await prisma.invite.delete({ where: { id: invite.id } })
  })

  it('adds a non-login member directly, no invite involved', async () => {
    const user = await makeUser('vitest-household-admin-2@example.com')
    const household = await createHousehold('Family', user.id, 'Admin User')
    createdHouseholdIds.push(household.id)

    const member = await addNonLoginMember(household.id, 'Mama')
    expect(member.userId).toBeNull()
    expect(member.displayName).toBe('Mama')
  })

  it('refuses to remove the last admin', async () => {
    const user = await makeUser('vitest-household-lastadmin@example.com')
    const household = await createHousehold('Apartment', user.id, 'Admin User')
    createdHouseholdIds.push(household.id)

    const admin = await prisma.member.findFirstOrThrow({ where: { householdId: household.id } })
    await expect(removeMember(admin.id)).rejects.toThrow('Cannot remove the last admin')
  })

  it('does not leak members across households', async () => {
    const user = await makeUser('vitest-household-scope@example.com')
    const householdA = await createHousehold('Household A', user.id, 'Admin User')
    const householdB = await createHousehold('Household B', user.id, 'Admin User')
    createdHouseholdIds.push(householdA.id, householdB.id)

    const membersOfA = await prisma.member.findMany({ where: { householdId: householdA.id } })
    expect(membersOfA.every((m) => m.householdId === householdA.id)).toBe(true)
    expect(membersOfA.some((m) => m.householdId === householdB.id)).toBe(false)
  })
})

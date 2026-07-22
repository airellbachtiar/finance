import { describe, it, expect, afterEach } from 'vitest'
import { prisma } from './db'
import { isInvited, consumeInvite } from './invites'

const TEST_EMAIL = 'vitest-invite-test@example.com'

afterEach(async () => {
  await prisma.invite.deleteMany({ where: { email: TEST_EMAIL } })
})

describe('invites', () => {
  it('is not invited when no invite record exists', async () => {
    expect(await isInvited(TEST_EMAIL)).toBe(false)
  })

  it('is invited when an unconsumed invite exists', async () => {
    await prisma.invite.create({ data: { email: TEST_EMAIL } })
    expect(await isInvited(TEST_EMAIL)).toBe(true)
  })

  it('remains invited after the invite is consumed, so a returning user can sign back in', async () => {
    // Regression test: consumedAt is a record of first use, not an expiry.
    // A prior bug required consumedAt === null, which meant every login
    // after the first looked "uninvited" and got the user's account deleted.
    await prisma.invite.create({ data: { email: TEST_EMAIL } })
    await consumeInvite(TEST_EMAIL, 'placeholder-user-id', 'Test User')
    expect(await isInvited(TEST_EMAIL)).toBe(true)
  })

  it('creates a Member row linking the user to the invited household on consumption', async () => {
    const household = await prisma.household.create({ data: { name: 'Vitest Household' } })
    const user = await prisma.user.create({ data: { email: TEST_EMAIL } })

    await prisma.invite.create({ data: { email: TEST_EMAIL, householdId: household.id } })
    await consumeInvite(TEST_EMAIL, user.id, 'Test User')

    const member = await prisma.member.findUnique({
      where: { householdId_userId: { householdId: household.id, userId: user.id } },
    })
    expect(member).not.toBeNull()
    expect(member?.displayName).toBe('Test User')

    await prisma.member.deleteMany({ where: { householdId: household.id } })
    await prisma.user.delete({ where: { id: user.id } })
    await prisma.household.delete({ where: { id: household.id } })
  })
})

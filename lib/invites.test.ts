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

  it('is not invited after the invite is consumed', async () => {
    await prisma.invite.create({ data: { email: TEST_EMAIL } })
    await consumeInvite(TEST_EMAIL)
    expect(await isInvited(TEST_EMAIL)).toBe(false)
  })
})

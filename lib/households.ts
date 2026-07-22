import { prisma } from './db'

export async function createHousehold(
  name: string,
  creatorUserId: string,
  creatorDisplayName: string
) {
  return prisma.household.create({
    data: {
      name,
      members: {
        create: {
          userId: creatorUserId,
          displayName: creatorDisplayName,
          role: 'ADMIN',
        },
      },
    },
    include: { members: true },
  })
}

export async function isHouseholdAdmin(userId: string, householdId: string): Promise<boolean> {
  const member = await prisma.member.findUnique({
    where: { householdId_userId: { householdId, userId } },
  })
  return member?.role === 'ADMIN'
}

export async function isHouseholdMember(userId: string, householdId: string): Promise<boolean> {
  const member = await prisma.member.findUnique({
    where: { householdId_userId: { householdId, userId } },
  })
  return member !== null
}

/**
 * Adds a login-required member by creating a household-scoped Invite —
 * the Member row itself is created later, when that email first signs in
 * (see lib/invites.ts consumeInvite).
 */
export async function inviteMember(householdId: string, email: string) {
  return prisma.invite.upsert({
    where: { email },
    update: { householdId },
    create: { email, householdId },
  })
}

/** Adds a non-login member (e.g. Mama) directly — no invite involved. */
export async function addNonLoginMember(householdId: string, displayName: string) {
  return prisma.member.create({
    data: { householdId, displayName, role: 'MEMBER' },
  })
}

/**
 * Sets a member's IBAN. Login members store it on their User (shared
 * across every household they're in, since it's their own bank account,
 * not household-specific) and can only set their own. Non-login members
 * store it directly on the Member record, settable only by an admin of
 * that household (mirrors who's allowed to add/remove them).
 */
export async function setMemberIban(
  memberId: string,
  iban: string | null,
  requesterUserId: string,
  requesterIsAdmin: boolean
) {
  const member = await prisma.member.findUnique({ where: { id: memberId } })
  if (!member) throw new Error('Member not found')

  if (member.userId) {
    if (member.userId !== requesterUserId) {
      throw new Error('Only the account owner can set their own IBAN')
    }
    await prisma.user.update({ where: { id: member.userId }, data: { iban } })
    return
  }

  if (!requesterIsAdmin) {
    throw new Error('Only an admin can set a non-login member’s IBAN')
  }
  await prisma.member.update({ where: { id: memberId }, data: { iban } })
}

export async function removeMember(memberId: string) {
  const member = await prisma.member.findUnique({ where: { id: memberId } })
  if (!member) return

  if (member.role === 'ADMIN') {
    const adminCount = await prisma.member.count({
      where: { householdId: member.householdId, role: 'ADMIN' },
    })
    if (adminCount <= 1) {
      throw new Error('Cannot remove the last admin of a household')
    }
  }

  await prisma.member.delete({ where: { id: memberId } })
}

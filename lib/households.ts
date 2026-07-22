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

import { prisma } from './db'

export async function isInvited(email: string): Promise<boolean> {
  const invite = await prisma.invite.findUnique({ where: { email } })
  return invite !== null && invite.consumedAt === null
}

/**
 * Marks the invite consumed, and — if it was scoped to a household — creates
 * the corresponding Member row linking the new/existing User to that
 * household. Household-less invites (e.g. the bootstrap /invite page) just
 * mark the invite consumed.
 */
export async function consumeInvite(
  email: string,
  userId: string,
  displayName: string
): Promise<void> {
  const invite = await prisma.invite.update({
    where: { email },
    data: { consumedAt: new Date() },
  })

  if (invite.householdId) {
    await prisma.member.upsert({
      where: { householdId_userId: { householdId: invite.householdId, userId } },
      update: {},
      create: { householdId: invite.householdId, userId, displayName },
    })
  }
}

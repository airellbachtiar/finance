import { prisma } from './db'

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * An invite existing at all — consumed or not — means this email was
 * legitimately approved. `consumedAt` is a record of first use, not an
 * expiry: someone who already signed in once must still be able to sign
 * back in on every later visit.
 */
export async function isInvited(email: string): Promise<boolean> {
  const invite = await prisma.invite.findUnique({ where: { email: normalizeEmail(email) } })
  return invite !== null
}

/**
 * Marks the invite consumed, and — if it was scoped to a household — creates
 * the corresponding Member row linking the new/existing User to that
 * household. Household-less invites (e.g. the bootstrap /invite page) just
 * mark the invite consumed.
 *
 * The User row referenced by `userId` is created by the NextAuth adapter
 * just before this runs, but under a fast double-fired OAuth callback (seen
 * on some mobile browsers) it can momentarily not exist yet by the time this
 * query lands — checked explicitly here rather than letting the upsert hit a
 * foreign key violation, since signIn callback errors surface to the user as
 * an opaque crash instead of a clean "try again" message.
 */
export async function consumeInvite(
  email: string,
  userId: string,
  displayName: string
): Promise<void> {
  const invite = await prisma.invite.update({
    where: { email: normalizeEmail(email) },
    data: { consumedAt: new Date() },
  })

  if (!invite.householdId) return

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!user) return

  await prisma.member.upsert({
    where: { householdId_userId: { householdId: invite.householdId, userId } },
    update: {},
    create: { householdId: invite.householdId, userId, displayName },
  })
}

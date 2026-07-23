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
 * The `userId` NextAuth hands the signIn callback isn't trusted as-is: under
 * a fast double-fired OAuth callback (seen on some mobile browsers) it can
 * reference a row from a sibling in-flight request rather than the one that
 * actually persisted, which previously caused this to either FK-violate or
 * silently skip Member creation for a user who really does exist. Email is
 * the stable, unique anchor — the User row is re-resolved by email here and
 * its id used for the upsert, ignoring the possibly-stale `userId` param.
 */
export async function consumeInvite(
  email: string,
  _userId: string,
  displayName: string
): Promise<void> {
  const normalizedEmail = normalizeEmail(email)
  const invite = await prisma.invite.update({
    where: { email: normalizedEmail },
    data: { consumedAt: new Date() },
  })

  if (!invite.householdId) return

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  })
  if (!user) return
  const resolvedUserId = user.id

  await prisma.member.upsert({
    where: { householdId_userId: { householdId: invite.householdId, userId: resolvedUserId } },
    update: {},
    create: { householdId: invite.householdId, userId: resolvedUserId, displayName },
  })
}

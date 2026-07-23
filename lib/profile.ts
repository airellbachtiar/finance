import { prisma } from './db'

/**
 * Updates the user's own display name. Member.displayName is a snapshot
 * taken at invite-consumption time (so it can exist independently of a
 * User, for non-login members) — it doesn't auto-follow User.name, so it's
 * updated here too across every household the user belongs to. Without
 * this, the name would change in the header but stay stale everywhere a
 * Member row is shown (member lists, expense payers, balances).
 */
export async function updateDisplayName(userId: string, name: string): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { name } }),
    prisma.member.updateMany({ where: { userId }, data: { displayName: name } }),
  ])
}

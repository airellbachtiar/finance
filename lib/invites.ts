import { prisma } from './db'

export async function isInvited(email: string): Promise<boolean> {
  const invite = await prisma.invite.findUnique({ where: { email } })
  return invite !== null && invite.consumedAt === null
}

export async function consumeInvite(email: string): Promise<void> {
  await prisma.invite.update({
    where: { email },
    data: { consumedAt: new Date() },
  })
}

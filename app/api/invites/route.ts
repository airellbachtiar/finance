import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendInviteEmail } from '@/lib/mailer'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { email: rawEmail } = await req.json()
  if (!rawEmail || typeof rawEmail !== 'string') {
    return NextResponse.json({ error: 'email is required' }, { status: 400 })
  }
  const email = rawEmail.trim().toLowerCase()

  const invite = await prisma.invite.upsert({
    where: { email },
    update: {},
    create: { email },
  })

  let emailSent = true
  try {
    await sendInviteEmail(email)
  } catch (err) {
    emailSent = false
    console.error('Failed to send invite email:', err)
  }

  return NextResponse.json({ invite, emailSent })
}

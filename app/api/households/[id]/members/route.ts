import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isHouseholdAdmin, isHouseholdMember, inviteMember, addNonLoginMember } from '@/lib/households'
import { sendInviteEmail } from '@/lib/mailer'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isMember = await isHouseholdMember(session.user.id, params.id)
  if (!isMember) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const members = await prisma.member.findMany({ where: { householdId: params.id } })
  return NextResponse.json({ members })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = await isHouseholdAdmin(session.user.id, params.id)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()

  if (typeof body.email === 'string' && body.email) {
    const invite = await inviteMember(params.id, body.email)

    let emailSent = true
    try {
      const household = await prisma.household.findUnique({
        where: { id: params.id },
        select: { name: true },
      })
      await sendInviteEmail(body.email, household?.name)
    } catch (err) {
      emailSent = false
      console.error('Failed to send invite email:', err)
    }

    return NextResponse.json({ invite, emailSent })
  }

  if (typeof body.displayName === 'string' && body.displayName) {
    const member = await addNonLoginMember(params.id, body.displayName)
    return NextResponse.json({ member })
  }

  return NextResponse.json({ error: 'email or displayName is required' }, { status: 400 })
}

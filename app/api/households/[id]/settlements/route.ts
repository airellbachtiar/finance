import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isHouseholdAdmin, isHouseholdMember } from '@/lib/households'
import { createSettlement } from '@/lib/settlements'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isMember = await isHouseholdMember(session.user.id, params.id)
  if (!isMember) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const settlements = await prisma.settlement.findMany({
    where: { householdId: params.id },
    include: { fromMember: true, toMember: true },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json({ settlements })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  const isAdmin = await isHouseholdAdmin(session.user.id, params.id)
  if (!isAdmin) {
    // Not an admin — still allow self-attested "I paid my own debt"
    // settlements (e.g. the dashboard's "mark as paid" flow), since that's
    // low-risk compared to recording someone *else's* payment on their
    // behalf. Admins remain the only ones who can edit/delete afterward.
    const ownMember = await prisma.member.findUnique({
      where: { householdId_userId: { householdId: params.id, userId: session.user.id } },
    })
    if (!ownMember || ownMember.id !== body.fromMemberId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  try {
    const settlement = await createSettlement({
      householdId: params.id,
      fromMemberId: body.fromMemberId,
      toMemberId: body.toMemberId,
      date: new Date(body.date),
      notes: body.notes,
      originalCurrency: body.originalCurrency,
      originalAmount: body.originalAmount,
      exchangeRate: body.exchangeRate ?? null,
    })
    return NextResponse.json({ settlement })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create settlement'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

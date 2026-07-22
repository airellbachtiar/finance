import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isHouseholdMember } from '@/lib/households'
import { createExpense } from '@/lib/expenses'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isMember = await isHouseholdMember(session.user.id, params.id)
  if (!isMember) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const expenses = await prisma.expense.findMany({
    where: { householdId: params.id },
    include: { splits: true, payer: true },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json({ expenses })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isMember = await isHouseholdMember(session.user.id, params.id)
  if (!isMember) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()

  try {
    const expense = await createExpense({
      householdId: params.id,
      payerId: body.payerId,
      date: new Date(body.date),
      category: body.category,
      notes: body.notes,
      originalCurrency: body.originalCurrency,
      originalAmount: body.originalAmount,
      exchangeRate: body.exchangeRate ?? null,
      memberIds: body.memberIds,
      splits: body.splits,
    })
    return NextResponse.json({ expense })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create expense'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

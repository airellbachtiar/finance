import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isHouseholdMember } from '@/lib/households'
import { updateExpense, deleteExpense } from '@/lib/expenses'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; expenseId: string } }
) {
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
    const expense = await updateExpense(params.expenseId, {
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
    const message = err instanceof Error ? err.message : 'Failed to update expense'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; expenseId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isMember = await isHouseholdMember(session.user.id, params.id)
  if (!isMember) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await deleteExpense(params.expenseId)
  return NextResponse.json({ success: true })
}

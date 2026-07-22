import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isHouseholdAdmin } from '@/lib/households'
import { updateSettlement, deleteSettlement } from '@/lib/settlements'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; settlementId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = await isHouseholdAdmin(session.user.id, params.id)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()

  try {
    const settlement = await updateSettlement(params.settlementId, {
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
    const message = err instanceof Error ? err.message : 'Failed to update settlement'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; settlementId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = await isHouseholdAdmin(session.user.id, params.id)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await deleteSettlement(params.settlementId)
  return NextResponse.json({ success: true })
}

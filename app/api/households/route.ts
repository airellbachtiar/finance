import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createHousehold } from '@/lib/households'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const households = await prisma.household.findMany({
    where: { members: { some: { userId: session.user.id } } },
    include: { members: true },
  })

  return NextResponse.json({ households })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name } = await req.json()
  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const household = await createHousehold(
    name,
    session.user.id,
    session.user.name ?? session.user.email ?? 'Admin'
  )

  return NextResponse.json({ household })
}

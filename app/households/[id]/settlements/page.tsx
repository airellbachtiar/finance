import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isHouseholdAdmin, isHouseholdMember } from '@/lib/households'
import { SettlementForm } from './SettlementForm'
import { SettlementList } from './SettlementList'

export default async function SettlementsPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p>Not authorized.</p>
      </main>
    )
  }

  const member = await isHouseholdMember(session.user.id, params.id)
  if (!member) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p>Not authorized.</p>
      </main>
    )
  }

  const [household, settlements, admin] = await Promise.all([
    prisma.household.findUnique({ where: { id: params.id }, include: { members: true } }),
    prisma.settlement.findMany({
      where: { householdId: params.id },
      include: { fromMember: true, toMember: true },
      orderBy: { date: 'desc' },
    }),
    isHouseholdAdmin(session.user.id, params.id),
  ])

  if (!household) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p>Household not found.</p>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 p-8">
      <h1 className="text-xl font-semibold">{household.name} — Settlements</h1>
      <div className="w-full max-w-2xl">
        <SettlementList
          householdId={household.id}
          settlements={JSON.parse(JSON.stringify(settlements))}
          isAdmin={admin}
        />
      </div>
      {admin && (
        <div className="w-full max-w-2xl">
          <SettlementForm householdId={household.id} members={household.members} />
        </div>
      )}
    </main>
  )
}

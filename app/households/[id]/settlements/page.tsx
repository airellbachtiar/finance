import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isHouseholdAdmin, isHouseholdMember } from '@/lib/households'
import { NotAuthorized } from '@/components/ui/NotAuthorized'
import { PageHeader } from '@/components/ui/PageHeader'
import { BackLink } from '@/components/ui/BackLink'
import { SettlementForm } from './SettlementForm'
import { SettlementList } from './SettlementList'

export default async function SettlementsPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return <NotAuthorized />
  }

  const member = await isHouseholdMember(session.user.id, params.id)
  if (!member) {
    return <NotAuthorized />
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
    return <NotAuthorized message="Household not found." />
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 p-4 sm:gap-8 sm:p-8">
      <div className="w-full max-w-2xl">
        <BackLink href={`/households/${household.id}`} label={household.name} />
      </div>
      <PageHeader title="Settlements" />
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

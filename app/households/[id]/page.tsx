import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isHouseholdAdmin, isHouseholdMember } from '@/lib/households'
import { getHouseholdBalances } from '@/lib/balance-engine'
import { getPairHistory } from '@/lib/dashboard'
import { NotAuthorized } from '@/components/ui/NotAuthorized'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { MemberForm } from './MemberForm'
import { MemberList } from './MemberList'
import { BalanceSummary } from './BalanceSummary'

export default async function HouseholdPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return <NotAuthorized />
  }

  const member = await isHouseholdMember(session.user.id, params.id)
  if (!member) {
    return <NotAuthorized />
  }

  const [household, admin, balances, otherHouseholds] = await Promise.all([
    prisma.household.findUnique({
      where: { id: params.id },
      include: { members: true },
    }),
    isHouseholdAdmin(session.user.id, params.id),
    getHouseholdBalances(params.id),
    prisma.household.findMany({
      where: { members: { some: { userId: session.user.id } }, NOT: { id: params.id } },
    }),
  ])

  if (!household) {
    return <NotAuthorized message="Household not found." />
  }

  const balancesWithHistory = await Promise.all(
    balances.map(async (b) => ({
      ...b,
      history: await getPairHistory(params.id, b.debtorMemberId, b.creditorMemberId),
    }))
  )

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 p-8">
      <PageHeader
        title={household.name}
        actions={
          <>
            <Link href={`/households/${household.id}/expenses`}>
              <Button variant="secondary">Expenses</Button>
            </Link>
            <Link href={`/households/${household.id}/settlements`}>
              <Button variant="secondary">Settlements</Button>
            </Link>
          </>
        }
      />

      {otherHouseholds.length > 0 && (
        <div className="flex w-full max-w-2xl items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
          <span>Switch to:</span>
          {otherHouseholds.map((h) => (
            <Link
              key={h.id}
              href={`/households/${h.id}`}
              className="text-indigo-600 hover:underline dark:text-indigo-400"
            >
              {h.name}
            </Link>
          ))}
        </div>
      )}

      <section className="flex w-full max-w-2xl flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          Balances
        </h2>
        <BalanceSummary
          balances={JSON.parse(JSON.stringify(balancesWithHistory))}
          members={household.members}
        />
      </section>

      <section className="flex w-full max-w-2xl flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          Members
        </h2>
        <MemberList householdId={household.id} members={household.members} isAdmin={admin} />
        {admin && <MemberForm householdId={household.id} />}
      </section>
    </main>
  )
}

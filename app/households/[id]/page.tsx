import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isHouseholdAdmin, isHouseholdMember } from '@/lib/households'
import { getHouseholdBalances } from '@/lib/balance-engine'
import { getPairHistory } from '@/lib/dashboard'
import { MemberForm } from './MemberForm'
import { MemberList } from './MemberList'
import { BalanceSummary } from './BalanceSummary'

export default async function HouseholdPage({ params }: { params: { id: string } }) {
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
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p>Household not found.</p>
      </main>
    )
  }

  const balancesWithHistory = await Promise.all(
    balances.map(async (b) => ({
      ...b,
      history: await getPairHistory(params.id, b.debtorMemberId, b.creditorMemberId),
    }))
  )

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 p-8">
      <h1 className="text-xl font-semibold">{household.name}</h1>

      {otherHouseholds.length > 0 && (
        <div className="flex gap-3 text-sm text-neutral-500">
          <span>Switch to:</span>
          {otherHouseholds.map((h) => (
            <Link key={h.id} href={`/households/${h.id}`} className="underline">
              {h.name}
            </Link>
          ))}
        </div>
      )}

      <div className="flex gap-4">
        <Link href={`/households/${household.id}/expenses`} className="underline">
          View expenses
        </Link>
        <Link href={`/households/${household.id}/settlements`} className="underline">
          View settlements
        </Link>
      </div>

      <BalanceSummary
        balances={JSON.parse(JSON.stringify(balancesWithHistory))}
        members={household.members}
      />

      <MemberList householdId={household.id} members={household.members} isAdmin={admin} />
      {admin && <MemberForm householdId={household.id} />}
    </main>
  )
}

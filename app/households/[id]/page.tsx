import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isHouseholdAdmin, isHouseholdMember } from '@/lib/households'
import { MemberForm } from './MemberForm'
import { MemberList } from './MemberList'

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

  const [household, admin] = await Promise.all([
    prisma.household.findUnique({
      where: { id: params.id },
      include: { members: true },
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
      <h1 className="text-xl font-semibold">{household.name}</h1>
      <MemberList householdId={household.id} members={household.members} isAdmin={admin} />
      {admin && <MemberForm householdId={household.id} />}
    </main>
  )
}

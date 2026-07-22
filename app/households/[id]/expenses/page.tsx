import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isHouseholdMember } from '@/lib/households'
import { NotAuthorized } from '@/components/ui/NotAuthorized'
import { PageHeader } from '@/components/ui/PageHeader'
import { ExpenseForm } from './ExpenseForm'
import { ExpenseList } from './ExpenseList'

export default async function ExpensesPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return <NotAuthorized />
  }

  const member = await isHouseholdMember(session.user.id, params.id)
  if (!member) {
    return <NotAuthorized />
  }

  const [household, expenses] = await Promise.all([
    prisma.household.findUnique({ where: { id: params.id }, include: { members: true } }),
    prisma.expense.findMany({
      where: { householdId: params.id },
      include: { splits: true, payer: true },
      orderBy: { date: 'desc' },
    }),
  ])

  if (!household) {
    return <NotAuthorized message="Household not found." />
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 p-8">
      <PageHeader title={`${household.name} — Expenses`} />
      <div className="w-full max-w-2xl">
        <ExpenseList
          householdId={household.id}
          expenses={JSON.parse(JSON.stringify(expenses))}
        />
      </div>
      <div className="w-full max-w-2xl">
        <ExpenseForm householdId={household.id} members={household.members} />
      </div>
    </main>
  )
}

import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NotAuthorized } from '@/components/ui/NotAuthorized'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { HouseholdForm } from './HouseholdForm'

export default async function HouseholdsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return <NotAuthorized />
  }

  const households = await prisma.household.findMany({
    where: { members: { some: { userId: session.user.id } } },
    include: { members: true },
  })

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 p-4 sm:gap-8 sm:p-8">
      <PageHeader title="Your households" subtitle="Pick one to see who owes who." />

      {households.length === 0 ? (
        <EmptyState>
          No households yet. Start one below — Apartment, Family, whatever fits.
        </EmptyState>
      ) : (
        <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
          {households.map((h) => (
            <Link key={h.id} href={`/households/${h.id}`}>
              <Card className="transition-colors hover:border-emerald-400 dark:hover:border-emerald-600">
                <p className="font-medium text-neutral-900 dark:text-neutral-100">{h.name}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {h.members.length} member{h.members.length === 1 ? '' : 's'}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <HouseholdForm />
    </main>
  )
}

import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { HouseholdForm } from './HouseholdForm'

export default async function HouseholdsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p>Not authorized.</p>
      </main>
    )
  }

  const households = await prisma.household.findMany({
    where: { members: { some: { userId: session.user.id } } },
    include: { members: true },
  })

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 p-8">
      <h1 className="text-xl font-semibold">Your households</h1>
      <ul className="flex flex-col gap-2">
        {households.map((h) => (
          <li key={h.id}>
            <Link href={`/households/${h.id}`} className="underline">
              {h.name}
            </Link>{' '}
            <span className="text-sm text-neutral-500">({h.members.length} members)</span>
          </li>
        ))}
        {households.length === 0 && <li className="text-neutral-500">No households yet.</li>}
      </ul>
      <HouseholdForm />
    </main>
  )
}

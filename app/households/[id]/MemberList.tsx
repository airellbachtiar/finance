'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

type MemberRow = {
  id: string
  displayName: string
  role: string
  userId: string | null
}

export function MemberList({
  householdId,
  members,
  isAdmin,
}: {
  householdId: string
  members: MemberRow[]
  isAdmin: boolean
}) {
  const router = useRouter()

  async function remove(memberId: string) {
    const res = await fetch(`/api/households/${householdId}/members/${memberId}`, {
      method: 'DELETE',
    })
    if (res.ok) router.refresh()
  }

  if (members.length === 0) {
    return <EmptyState>No members yet.</EmptyState>
  }

  return (
    <Card className="flex flex-col divide-y divide-neutral-200 p-0 dark:divide-neutral-800">
      {members.map((m) => (
        <div key={m.id} className="flex items-center justify-between px-4 py-3">
          <span className="text-neutral-900 dark:text-neutral-100">
            {m.displayName || '(unnamed)'}
            <span className="ml-2 text-sm text-neutral-500 dark:text-neutral-400">
              {m.role.toLowerCase()}
              {!m.userId && ' · no login'}
            </span>
          </span>
          {isAdmin && (
            <Button variant="danger" onClick={() => remove(m.id)}>
              Remove
            </Button>
          )}
        </div>
      ))}
    </Card>
  )
}

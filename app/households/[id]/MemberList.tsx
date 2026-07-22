'use client'

import { useRouter } from 'next/navigation'

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

  return (
    <ul className="flex flex-col gap-2">
      {members.map((m) => (
        <li key={m.id} className="flex items-center gap-3">
          <span>
            {m.displayName || '(unnamed)'} — {m.role.toLowerCase()}
            {!m.userId && <span className="text-neutral-500"> (no login)</span>}
          </span>
          {isAdmin && (
            <button onClick={() => remove(m.id)} className="text-sm text-red-600 underline">
              Remove
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}

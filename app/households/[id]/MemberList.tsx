'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'

type MemberRow = {
  id: string
  displayName: string
  role: string
  userId: string | null
  iban: string | null
}

function IbanEditor({
  householdId,
  member,
}: {
  householdId: string
  member: MemberRow
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [iban, setIban] = useState(member.iban ?? '')
  const [status, setStatus] = useState<string | null>(null)

  async function save() {
    const res = await fetch(`/api/households/${householdId}/members/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ iban: iban || null }),
    })
    if (res.ok) {
      setEditing(false)
      setStatus(null)
      router.refresh()
    } else {
      const body = await res.json().catch(() => null)
      setStatus(body?.error ?? 'Failed to save IBAN')
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
      >
        {member.iban ? `IBAN: ${member.iban}` : 'Add IBAN'}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        <Input
          value={iban}
          onChange={(e) => setIban(e.target.value)}
          placeholder="NLxx BANK xxxx xxxx xx"
          className="text-xs"
        />
        <Button variant="secondary" onClick={save}>
          Save
        </Button>
      </div>
      {status && <p className="text-xs text-red-600">{status}</p>}
    </div>
  )
}

export function MemberList({
  householdId,
  members,
  isAdmin,
  currentUserId,
}: {
  householdId: string
  members: MemberRow[]
  isAdmin: boolean
  currentUserId: string
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
      {members.map((m) => {
        const canEditIban = m.userId ? m.userId === currentUserId : isAdmin
        return (
          <div key={m.id} className="flex flex-col gap-1 px-4 py-3">
            <div className="flex items-center justify-between">
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
            {canEditIban ? (
              <IbanEditor householdId={householdId} member={m} />
            ) : (
              m.iban && (
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  IBAN: {m.iban}
                </span>
              )
            )}
          </div>
        )
      })}
    </Card>
  )
}

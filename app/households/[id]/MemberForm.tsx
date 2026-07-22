'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function MemberForm({ householdId }: { householdId: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  async function invite(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch(`/api/households/${householdId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setStatus(res.ok ? `Invited ${email}` : 'Failed to invite')
    if (res.ok) {
      setEmail('')
      router.refresh()
    }
  }

  async function addNonLogin(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch(`/api/households/${householdId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName }),
    })
    setStatus(res.ok ? `Added ${displayName}` : 'Failed to add member')
    if (res.ok) {
      setDisplayName('')
      router.refresh()
    }
  }

  return (
    <Card className="flex flex-col gap-4 sm:flex-row sm:gap-6">
      <form onSubmit={invite} className="flex flex-1 gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Invite by email"
          className="flex-1"
        />
        <Button type="submit" variant="secondary">
          Invite
        </Button>
      </form>
      <form onSubmit={addNonLogin} className="flex flex-1 gap-2">
        <Input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Add non-login member (e.g. Mama)"
          className="flex-1"
        />
        <Button type="submit" variant="secondary">
          Add
        </Button>
      </form>
      {status && <p className="text-sm text-neutral-500 dark:text-neutral-400">{status}</p>}
    </Card>
  )
}

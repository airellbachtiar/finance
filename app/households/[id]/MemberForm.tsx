'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
    <div className="flex flex-col gap-4">
      <form onSubmit={invite} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Invite by email (login member)"
          className="rounded border px-3 py-2 text-black"
        />
        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          Invite
        </button>
      </form>
      <form onSubmit={addNonLogin} className="flex gap-2">
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Add non-login member (e.g. Mama)"
          className="rounded border px-3 py-2 text-black"
        />
        <button type="submit" className="rounded border px-4 py-2">
          Add
        </button>
      </form>
      {status && <p className="text-sm">{status}</p>}
    </div>
  )
}

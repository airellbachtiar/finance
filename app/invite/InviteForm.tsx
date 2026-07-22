'use client'

import { useState } from 'react'

export function InviteForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setStatus(res.ok ? `Invited ${email}` : 'Failed to create invite')
    if (res.ok) setEmail('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 items-center">
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          className="rounded border px-3 py-2 text-black"
        />
        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          Invite
        </button>
      </div>
      {status && <p className="text-sm">{status}</p>}
    </form>
  )
}

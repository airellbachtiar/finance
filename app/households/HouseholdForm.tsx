'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function HouseholdForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/households', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      setName('')
      setStatus(null)
      router.refresh()
    } else {
      setStatus('Failed to create household')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Household name (e.g. Apartment)"
        className="rounded border px-3 py-2 text-black"
      />
      <button type="submit" className="rounded bg-black px-4 py-2 text-white">
        Create
      </button>
      {status && <p className="text-sm">{status}</p>}
    </form>
  )
}

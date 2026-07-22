'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

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
    <Card className="w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Household name (e.g. Apartment)"
          className="flex-1"
        />
        <Button type="submit">Create household</Button>
        {status && <p className="text-sm text-red-600">{status}</p>}
      </form>
    </Card>
  )
}

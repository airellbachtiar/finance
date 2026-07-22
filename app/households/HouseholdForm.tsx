'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'

export function HouseholdForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
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
    setSubmitting(false)
  }

  return (
    <Card className="w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
        <Label htmlFor="household-name">Household name</Label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            id="household-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Apartment"
            className="flex-1"
          />
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create household'}
          </Button>
        </div>
        {status && <p className="text-sm text-red-600">{status}</p>}
      </form>
    </Card>
  )
}

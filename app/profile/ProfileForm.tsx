'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'

export function ProfileForm({ currentName, email }: { currentName: string; email: string }) {
  const { update } = useSession()
  const router = useRouter()
  const [name, setName] = useState(currentName)
  const [status, setStatus] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setStatus(null)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      await update({ name })
      setStatus('Saved')
      router.refresh()
    } else {
      const body = await res.json().catch(() => null)
      setStatus(body?.error ?? 'Failed to save')
    }
    setSubmitting(false)
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="profile-email">Email</Label>
          <Input id="profile-email" type="email" value={email} disabled />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="profile-name">Display name</Label>
          <Input
            id="profile-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>
        <div>
          <Button type="submit" disabled={submitting || !name.trim()}>
            {submitting ? 'Saving…' : 'Save'}
          </Button>
        </div>
        {status && (
          <p role="status" className="text-sm text-neutral-500 dark:text-neutral-400">
            {status}
          </p>
        )}
      </form>
    </Card>
  )
}

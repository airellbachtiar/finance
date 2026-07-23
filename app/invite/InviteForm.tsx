'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'

export function InviteForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const res = await fetch('/api/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (res.ok) {
      const body = await res.json()
      setStatus(
        body.emailSent
          ? `Invited ${email} — invite email sent`
          : `Invited ${email}, but the email failed to send — let them know to sign in directly`
      )
      setEmail('')
    } else {
      setStatus('Failed to create invite')
    }
    setSubmitting(false)
  }

  return (
    <Card className="w-full max-w-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
        <Label htmlFor="invite-email">Email address</Label>
        <div className="flex gap-2">
          <Input
            id="invite-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="flex-1"
          />
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Inviting…' : 'Invite'}
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

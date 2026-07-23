'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'

export function MemberForm({ householdId }: { householdId: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [invitingSubmitting, setInvitingSubmitting] = useState(false)

  async function invite(e: React.FormEvent) {
    e.preventDefault()
    setInvitingSubmitting(true)
    const res = await fetch(`/api/households/${householdId}/members`, {
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
      router.refresh()
    } else {
      setStatus('Failed to invite')
    }
    setInvitingSubmitting(false)
  }

  return (
    <Card className="flex flex-col gap-1.5">
      <form onSubmit={invite} className="flex flex-col gap-1.5">
        <Label htmlFor="member-email">Invite by email</Label>
        <div className="flex gap-2">
          <Input
            id="member-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="flex-1"
          />
          <Button type="submit" variant="secondary" disabled={invitingSubmitting}>
            {invitingSubmitting ? 'Inviting…' : 'Invite'}
          </Button>
        </div>
      </form>
      {status && (
        <p role="status" className="text-sm text-neutral-500 dark:text-neutral-400">
          {status}
        </p>
      )}
    </Card>
  )
}

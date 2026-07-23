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
  const [displayName, setDisplayName] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [invitingSubmitting, setInvitingSubmitting] = useState(false)
  const [addingSubmitting, setAddingSubmitting] = useState(false)

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

  async function addNonLogin(e: React.FormEvent) {
    e.preventDefault()
    setAddingSubmitting(true)
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
    setAddingSubmitting(false)
  }

  return (
    <Card className="flex flex-col gap-4 sm:flex-row sm:gap-6">
      <form onSubmit={invite} className="flex flex-1 flex-col gap-1.5">
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
      <form onSubmit={addNonLogin} className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor="member-displayName">Add non-login member</Label>
        <div className="flex gap-2">
          <Input
            id="member-displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Mama"
            className="flex-1"
          />
          <Button type="submit" variant="secondary" disabled={addingSubmitting}>
            {addingSubmitting ? 'Adding…' : 'Add'}
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

'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-neutral-50 p-8 dark:bg-neutral-950">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
          Family Ledger
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Who owes who, and why.
        </p>
      </div>

      <Card className="flex w-full max-w-sm flex-col gap-4">
        <Button variant="primary" onClick={() => signIn('google')}>
          Sign in with Google
        </Button>

        <div className="flex items-center gap-3 text-xs uppercase text-neutral-400">
          <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
          or
          <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            signIn('email', { email, redirect: false })
            setSent(true)
          }}
          className="flex flex-col gap-2"
        >
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Button type="submit" variant="secondary">
            Email me a link
          </Button>
        </form>
        {sent && (
          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
            Check your email for a sign-in link.
          </p>
        )}
      </Card>
    </main>
  )
}

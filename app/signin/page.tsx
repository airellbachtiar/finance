'use client'

import { signIn } from 'next-auth/react'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Label } from '@/components/ui/Label'
import { ThemeToggle } from '@/components/ThemeToggle'

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:
    "That account hasn't been invited yet. Ask an admin to invite this exact email, or sign in with the account that was invited.",
  OAuthAccountNotLinked:
    'This email is already registered via a different sign-in method. Try the method you used the first time.',
  OAuthSignin: 'Could not start Google sign-in. Please try again.',
  OAuthCallback: 'Google sign-in failed on the way back to the app. Please try again.',
  Verification: 'That sign-in link has expired or was already used. Request a new one below.',
  Default: 'Sign-in failed. Please try again.',
}

function SignInError() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  if (!error) return null
  const message = ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default
  return (
    <p
      role="alert"
      className="rounded-md bg-red-50 p-3 text-center text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
    >
      {message}
    </p>
  )
}

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [submittingGoogle, setSubmittingGoogle] = useState(false)
  const [submittingEmail, setSubmittingEmail] = useState(false)

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 bg-neutral-50 p-8 dark:bg-neutral-950">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="text-center">
        <h1 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
          Family Ledger
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Who owes who, and why.
        </p>
      </div>

      <Card className="flex w-full max-w-sm flex-col gap-4">
        <Suspense fallback={null}>
          <SignInError />
        </Suspense>
        <Button
          variant="primary"
          disabled={submittingGoogle}
          onClick={() => {
            setSubmittingGoogle(true)
            signIn('google')
          }}
        >
          {submittingGoogle ? 'Redirecting…' : 'Sign in with Google'}
        </Button>

        <div className="flex items-center gap-3 text-xs uppercase text-neutral-400">
          <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
          or
          <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault()
            setSubmittingEmail(true)
            await signIn('email', { email, redirect: false })
            setSubmittingEmail(false)
            setSent(true)
          }}
          className="flex flex-col gap-2"
        >
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Button type="submit" variant="secondary" disabled={submittingEmail}>
            {submittingEmail ? 'Sending…' : 'Email me a link'}
          </Button>
        </form>
        {sent && (
          <p role="status" className="text-center text-sm text-neutral-500 dark:text-neutral-400">
            Check your email for a sign-in link.
          </p>
        )}
      </Card>
    </main>
  )
}

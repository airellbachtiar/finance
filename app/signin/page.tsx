'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'

export default function SignInPage() {
  const [email, setEmail] = useState('')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">Family Ledger</h1>
      <button
        onClick={() => signIn('google')}
        className="rounded bg-black px-4 py-2 text-white"
      >
        Sign in with Google
      </button>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          signIn('email', { email })
        }}
        className="flex gap-2"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          className="rounded border px-3 py-2"
        />
        <button type="submit" className="rounded border px-4 py-2">
          Email me a link
        </button>
      </form>
    </main>
  )
}

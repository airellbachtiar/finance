'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

export function AppHeader() {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (pathname === '/signin') return null

  return (
    <header className="flex w-full items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
      <Link href="/households" className="text-lg font-semibold">
        Family Ledger
      </Link>
      {session?.user && (
        <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
          <span>{session.user.name ?? session.user.email}</span>
          <button
            onClick={() => signOut({ callbackUrl: '/signin' })}
            className="text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  )
}

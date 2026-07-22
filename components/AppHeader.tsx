'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { ThemeToggle } from './ThemeToggle'

export function AppHeader() {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (pathname === '/signin') return null

  return (
    <header className="flex w-full items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 sm:px-6 sm:py-4 dark:border-neutral-800">
      <Link href="/households" className="shrink-0 text-lg font-semibold">
        Family Ledger
      </Link>
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <ThemeToggle />
        {session?.user && (
          <div className="flex min-w-0 items-center gap-2 text-sm text-neutral-500 sm:gap-4 dark:text-neutral-400">
            <span className="hidden truncate sm:inline">
              {session.user.name ?? session.user.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: '/signin' })}
              className="shrink-0 text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

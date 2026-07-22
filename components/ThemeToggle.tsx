'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

const OPTIONS = [
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'system', label: 'System', icon: '🖥️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
] as const

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid a server/client mismatch: the server has no way to know the
  // user's stored preference, so we only render the real state post-mount.
  useEffect(() => setMounted(true), [])

  return (
    <div
      className="flex items-center gap-0.5 rounded-md border border-neutral-300 p-0.5 dark:border-neutral-700"
      role="radiogroup"
      aria-label="Color theme"
    >
      {OPTIONS.map((option) => {
        const selected = mounted && theme === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            title={option.label}
            onClick={() => setTheme(option.value)}
            className={`rounded px-2 py-1 text-xs transition-colors ${
              selected
                ? 'bg-indigo-600 text-white'
                : 'text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
            }`}
          >
            <span aria-hidden>{option.icon}</span>
          </button>
        )
      })}
    </div>
  )
}

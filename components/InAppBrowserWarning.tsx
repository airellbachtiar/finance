'use client'

import { useEffect, useState } from 'react'
import { isLikelyInAppBrowser } from '@/lib/in-app-browser'

export function InAppBrowserWarning() {
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setShow(isLikelyInAppBrowser(navigator.userAgent))
  }, [])

  if (!show) return null

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      role="alert"
      className="w-full max-w-sm rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
    >
      <p className="font-medium">Google sign-in won&apos;t work here</p>
      <p className="mt-1">
        You&apos;re viewing this inside an app&apos;s built-in browser (like WhatsApp or
        Instagram), which Google blocks for sign-in. Tap the menu (⋯ or ⋮) and choose{' '}
        <strong>&quot;Open in Browser&quot;</strong>, or copy this link and paste it into
        Safari/Chrome.
      </p>
      <button
        onClick={copyLink}
        className="mt-2 rounded border border-amber-400 px-2 py-1 text-xs font-medium hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900"
      >
        {copied ? 'Copied!' : 'Copy link'}
      </button>
    </div>
  )
}

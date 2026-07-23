import Link from 'next/link'

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1 text-sm text-neutral-500 hover:text-emerald-600 dark:text-neutral-400 dark:hover:text-emerald-400"
    >
      <span aria-hidden>←</span> {label}
    </Link>
  )
}

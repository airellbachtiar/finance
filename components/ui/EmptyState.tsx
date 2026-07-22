export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="w-full max-w-2xl rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
      {children}
    </p>
  )
}

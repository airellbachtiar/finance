export function NotAuthorized({ message = 'Not authorized.' }: { message?: string }) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center p-8">
      <p className="text-neutral-500 dark:text-neutral-400">{message}</p>
    </main>
  )
}

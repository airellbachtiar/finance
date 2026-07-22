import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { InviteForm } from './InviteForm'

export default async function InvitePage() {
  const session = await getServerSession(authOptions)

  if (session?.user?.email !== process.env.ADMIN_EMAIL) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p>Not authorized.</p>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-xl font-semibold">Invite a member</h1>
      <InviteForm />
    </main>
  )
}

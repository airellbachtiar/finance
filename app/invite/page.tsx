import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NotAuthorized } from '@/components/ui/NotAuthorized'
import { PageHeader } from '@/components/ui/PageHeader'
import { InviteForm } from './InviteForm'

export default async function InvitePage() {
  const session = await getServerSession(authOptions)

  if (session?.user?.email !== process.env.ADMIN_EMAIL) {
    return <NotAuthorized />
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 p-8">
      <PageHeader title="Invite a member" subtitle="Approve an email to create an account." />
      <InviteForm />
    </main>
  )
}

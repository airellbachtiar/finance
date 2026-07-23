import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NotAuthorized } from '@/components/ui/NotAuthorized'
import { PageHeader } from '@/components/ui/PageHeader'
import { BackLink } from '@/components/ui/BackLink'
import { ProfileForm } from './ProfileForm'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return <NotAuthorized />
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 p-4 sm:gap-8 sm:p-8">
      <div className="w-full max-w-sm">
        <BackLink href="/households" label="All households" />
      </div>
      <PageHeader title="Profile" />
      <div className="w-full max-w-sm">
        <ProfileForm currentName={session.user.name ?? ''} email={session.user.email ?? ''} />
      </div>
    </main>
  )
}

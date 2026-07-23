import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import EmailProvider from 'next-auth/providers/email'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './db'
import { isInvited, consumeInvite } from './invites'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // NextAuth redirects to `/signin?error=...` using whatever this callback
      // throws as the query value; an unexpected raw (multi-line) exception
      // makes that an invalid HTTP header and crashes with an opaque, bodyless
      // 500 instead of a real error page. Every exit must be a clean boolean.
      try {
        if (!user.email) return false
        const allowed = await isInvited(user.email)
        if (!allowed) {
          // The Prisma adapter creates the User row before this callback runs,
          // so an uninvited sign-in attempt would otherwise leave a dangling,
          // unusable User record behind.
          if (user.id) {
            await prisma.user.delete({ where: { id: user.id } }).catch(() => {})
          }
          return false
        }
        await consumeInvite(user.email, user.id, user.name ?? user.email)
        return true
      } catch (err) {
        console.error('signIn callback failed:', err)
        return false
      }
    },
    async jwt({ token, user, trigger, session }) {
      if (user) token.id = user.id
      // Fired by the profile page's `useSession().update({ name })` call, so
      // a name change shows up immediately instead of needing a re-login.
      if (trigger === 'update' && session?.name) {
        token.name = session.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string
      return session
    },
  },
  pages: {
    signIn: '/signin',
    // Without this, errors that aren't a signIn-callback rejection (e.g. a
    // genuine OAuth protocol error like a missing state cookie) fall back to
    // NextAuth's own bare built-in error page instead of the app's /signin,
    // which is the only place that actually reads ?error= and shows a real
    // message.
    error: '/signin',
  },
}

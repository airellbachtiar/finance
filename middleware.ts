import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextFetchEvent, NextRequest } from 'next/server'

// Vercel also resolves www.airell.moe, but Google's OAuth redirect_uri and
// NEXTAUTH_URL are both pinned to the apex domain only. If a sign-in attempt
// starts on www, the CSRF/session cookies get set on the wrong host and never
// reach the callback — auth silently never sticks, on any page. Canonicalize
// before anything else runs.
const CANONICAL_HOST = 'airell.moe'
const AUTH_EXEMPT_PREFIXES = ['/api/auth', '/signin']

const authMiddleware = withAuth({
  pages: {
    signIn: '/signin',
  },
})

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  const host = req.headers.get('host')
  if (host && host !== CANONICAL_HOST && host.endsWith('airell.moe')) {
    const url = new URL(req.url)
    url.host = CANONICAL_HOST
    return NextResponse.redirect(url, 308)
  }

  if (AUTH_EXEMPT_PREFIXES.some((prefix) => req.nextUrl.pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  return authMiddleware(req as Parameters<typeof authMiddleware>[0], event)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

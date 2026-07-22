---
id: mobile-google-signin-fix
title: "Fix and finish diagnosing: Google sign-in silently fails on mobile"
intent: family-ledger
complexity: low
mode: confirm
status: pending
depends_on:
  - auth-setup
created: "2026-07-22T19:50:00Z"
---

# Work Item: Fix and finish diagnosing: Google sign-in silently fails on mobile

## Description

User reported: on their phone, tapping "Sign in with Google" at `/signin` appears to do nothing — they end up back on `/signin?callbackUrl=%2F` with no visible feedback. Investigation this session found and fixed one real bug, confirmed the server-side OAuth chain is healthy, but the client-side root cause on the actual mobile device is still unconfirmed (no remote device access to reproduce).

## What was already verified/fixed this session

- **Server-side OAuth chain confirmed healthy**: a cookie-jar-based `curl` simulation of `POST /api/auth/signin/google` correctly returns a 302 to `accounts.google.com` with the right `client_id`, `redirect_uri=https://airell.moe/api/auth/callback/google`, and valid PKCE/state cookies. Google's redirect URI registration (added earlier for the `airell.moe` custom domain) is working.
- **`callbackUrl=%2F`** in the URL the user saw is just middleware's normal "not authenticated yet" redirect target when visiting `/` — not an error state, and not itself a bug.
- **Real bug found and fixed (uncommitted — see below)**: `app/signin/page.tsx` never read or displayed NextAuth's `?error=` query param. Any actual sign-in rejection (e.g. authenticating with a Google account whose email was never invited — plausible if the phone's default Google account differs from the invited `airell.bachtiar@gmail.com`) would silently return the user to a blank-looking sign-in page with zero explanation. Fixed by adding a `SignInError` component (reads `useSearchParams().get('error')`, maps common NextAuth error codes — `AccessDenied`, `OAuthAccountNotLinked`, `OAuthSignin`, `OAuthCallback`, `Verification` — to plain-language messages, wrapped in `<Suspense>` per Next.js App Router requirements for `useSearchParams`).
- Build passes, all 48 existing tests pass with this change.

## Why this fix isn't committed yet

`app/signin/page.tsx` (and several sibling files) had unrelated, apparently-still-in-progress concurrent edits already on disk when this investigation started (a dark/light theme toggle, a `Label` component, a `next-themes` dependency addition). The error-display fix was layered on top of that in-progress work in the same file, so it couldn't be cleanly isolated into its own commit without either reverting someone else's uncommitted work or bundling unverified WIP under this fix's name.

**First step for whoever picks this up**: check whether `app/signin/page.tsx` still contains the `SignInError`/`ERROR_MESSAGES`/`useSearchParams` addition (it may already be sitting uncommitted on disk, or may have been committed already as part of the theme-toggle work finishing up). If present, verify it, then fold it into whatever commit lands that other in-progress UI work — don't re-do it from scratch.

## Acceptance Criteria

- [x] Confirm (or re-apply) the sign-in page error-display fix described above is committed and deployed — committed in `c8680aa` (bundled with the theme-toggle/UX work that was in progress in the same file), deployed and verified live at `https://airell.moe/signin`
- [ ] Reproduce the actual mobile failure with real device access or remote debugging (e.g. ask the user to check if they're opening the link inside an in-app browser like Instagram/WhatsApp/Slack — Google blocks OAuth from embedded WebViews outright with `Error 403: disallowed_useragent`, which is unfixable in-app and requires opening in the system browser instead)
- [ ] If it's not an in-app-browser issue: check whether tapping "Sign in with Google" actually triggers navigation to Google's consent screen at all on the affected device (client-side JS/event issue) vs. completes the OAuth round-trip but the session doesn't stick afterward (cookie issue — check `__Secure-` cookie behavior under mobile Safari ITP if the user is on iOS)
- [ ] Once root cause is confirmed, fix it and verify with the actual reporting user on their actual device — this bug was never reproduced by the agent, only investigated indirectly via curl

## Technical Notes

- `lib/auth.ts`'s `signIn` callback logic itself was re-verified correct and unchanged this session (invite-existence check, dangling-user cleanup on rejection).
- No changes were made to `middleware.ts`, `lib/invites.ts`, or Google Cloud Console config this session — those were fixed/verified in earlier work.
- If the eventual root cause turns out to be in-app-browser blocking, the fix is user education (open in system browser), not code — but worth adding a lightweight in-app-browser detection banner ("Open in Safari/Chrome for Google sign-in") if this recurs, since it's a common real-world failure mode for shared links (WhatsApp is the obvious vector for a family app).

## Dependencies

- auth-setup

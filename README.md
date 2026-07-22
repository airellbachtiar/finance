# Family Ledger

A shared ledger web app that answers one question: **who owes who, and why.**

Not a budgeting app — it never stores or lets anyone edit a balance directly. Every balance is derived from a recorded history of expenses and settlements across two households:

- **Apartment** — three-way shared flat, equal split with per-expense overrides
- **Family** — bulk/irregular reimbursements, including a non-login member ("Mama")

See `.specs-fire/intents/family-ledger/brief.md` for the full project intent, and `.specs-fire/standards/` for tech stack and architecture decisions.

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and fill in `DATABASE_URL` (a free [Neon](https://neon.tech) Postgres instance works well), plus the auth variables described below.
3. Run the initial migration:
   ```bash
   npx prisma migrate dev
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
   The app runs at [http://localhost:3000](http://localhost:3000).

## Auth

Sign-in is invite-only — Google OAuth and email magic-link, gated by an `Invite` record. There's no public signup.

- To invite someone, sign in as the account matching `ADMIN_EMAIL` and go to `/invite`.
- `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` come from a Google Cloud OAuth client (Web application type), with redirect URIs for both `http://localhost:3000/api/auth/callback/google` and the production URL.
- `EMAIL_SERVER`/`EMAIL_FROM` send magic links via SMTP — currently Gmail SMTP with an App Password. Plan to switch to a dedicated transactional provider (e.g. Resend) once a custom domain is attached.
- `NEXTAUTH_SECRET` is a random string (`openssl rand -base64 32` or equivalent) used to sign session tokens.

## Testing

```bash
npm run test        # run once
npm run test:watch  # watch mode
```

## Deployment

Deployed on [Vercel](https://vercel.com), auto-deploying from `main`. `DATABASE_URL` (and later, auth secrets) are set as Vercel project environment variables — never committed.

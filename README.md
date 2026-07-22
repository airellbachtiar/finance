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
2. Copy `.env.example` to `.env.local` and fill in `DATABASE_URL` (a free [Neon](https://neon.tech) Postgres instance works well). Auth-related variables are only needed once the `auth-setup` work item lands.
3. Run the initial migration:
   ```bash
   npx prisma migrate dev
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
   The app runs at [http://localhost:3000](http://localhost:3000).

## Testing

```bash
npm run test        # run once
npm run test:watch  # watch mode
```

## Deployment

Deployed on [Vercel](https://vercel.com), auto-deploying from `main`. `DATABASE_URL` (and later, auth secrets) are set as Vercel project environment variables — never committed.

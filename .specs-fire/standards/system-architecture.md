# System Architecture

## Overview

Family Ledger is a single Next.js application backed by one Postgres database. It has no external integrations beyond auth providers (Google OAuth) — it deliberately does not connect to any bank API. It exists to answer one question — "who owes who, and why" — by recording financial events and deriving balances on read.

## System Context

A single admin (the user) and a small number of family members interact with the app through a web browser. There are two independent households sharing the same app instance: "Apartment" (user + 2 brothers) and "Family" (user + Mama, who has no login).

### Context Diagram

```
┌─────────────┐        ┌──────────────────┐        ┌─────────────┐
│  Brothers   │        │                  │        │   Google    │
│  (browser)  ├───────►│  Family Ledger   │◄───────┤   OAuth     │
└─────────────┘        │  (Next.js app,   │        └─────────────┘
┌─────────────┐        │   Vercel)        │
│  Admin user ├───────►│                  │
│  (browser,  │        └────────┬─────────┘
│  logs Mama's│                 │
│  entries)   │                 ▼
└─────────────┘        ┌──────────────────┐
                        │ Postgres (Neon)  │
                        └──────────────────┘
```

### Users

- **Admin (primary user)**: manages both households, invites members, records expenses/settlements, logs entries on Mama's behalf
- **Brother A / Brother B**: members of the Apartment household; can log in, view balances, add expenses/settlements
- **Mama**: non-login member of the Family household; represented in the data model but never authenticates

### External Systems

- **Google OAuth**: identity provider for login (alongside email login via NextAuth)
- **Neon (Postgres)**: managed database
- **Vercel**: hosting/deployment, custom domain DNS target

## Architecture Pattern

**Pattern**: Monolithic full-stack Next.js app (App Router), server components + route handlers, single Postgres database
**Rationale**: Small user base (~5 people), no need for service decomposition. Optimizes for low operational overhead over scalability.

## Component Architecture

### Components

#### Auth module
- **Purpose**: Authenticate members, gate invite-only signup
- **Responsibilities**: NextAuth configuration, session handling, invite validation
- **Dependencies**: NextAuth, Google OAuth credentials, Prisma (User/Session tables)

#### Household/Member module
- **Purpose**: Represent households and their members, including non-login members
- **Responsibilities**: CRUD for households, members, roles (admin/member), invites
- **Dependencies**: Prisma, Auth module

#### Expense module
- **Purpose**: Record financial events that create obligations
- **Responsibilities**: Expense CRUD, split calculation/override, currency conversion (IDR→EUR)
- **Dependencies**: Household/Member module

#### Settlement module
- **Purpose**: Record financial events that discharge obligations
- **Responsibilities**: Settlement CRUD (from/to/amount/date)
- **Dependencies**: Household/Member module

#### Balance engine
- **Purpose**: Compute current balances from the full event log
- **Responsibilities**: Pure derivation function — given all expenses + settlements for a household, return each member's net position
- **Dependencies**: Expense module, Settlement module (reads their data, has no dependents write back to it)

#### Dashboard
- **Purpose**: Present "who owes who, how much, why, since when" per household
- **Responsibilities**: Query balance engine, render per-household views
- **Dependencies**: Balance engine

### Component Diagram

```
Auth ──► Household/Member ──► Expense ──┐
                          └─► Settlement ┴─► Balance Engine ──► Dashboard
```

## Data Flow

A financial event (expense or settlement) is recorded through its module, persisted to Postgres. The balance engine reads all events for a household on demand and computes current balances — no balance is ever written directly to the database.

```
User action (add expense/settlement)
   → Route handler validates + persists event
   → Dashboard requests current balances
   → Balance engine reads full event log for the household
   → Balance engine returns computed per-member balances
   → Dashboard renders
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js (React), Tailwind CSS | UI |
| API | Next.js Route Handlers | Application logic |
| Domain logic | TypeScript (`lib/`) | Balance engine, currency conversion |
| Data | Prisma + PostgreSQL (Neon) | Persistence |
| Auth | NextAuth (email + Google) | Identity |
| Hosting | Vercel + custom domain | Deployment, 24/7 availability |

## Non-Functional Requirements

### Performance

- **Dashboard load**: balances for a household should render in well under 1s at this data scale (dozens to low hundreds of events/year)

### Security

- No secrets in source control; all credentials via Vercel environment variables
- Invite-only membership — no public signup surface
- IBAN/settlement details visible only to the involved household's members

### Scalability

Not a design concern at this scale (~5 users, two households). No horizontal scaling, caching, or queueing needed.

## Constraints

- Must never store an editable "balance" field — always derived from the event log
- Must support non-login members (Mama) as first-class household members, not a workaround
- Must support two independently-scoped households without cross-contamination of balances
- No real bank/payment API integration — settlement is user-confirmed ("mark as paid"), the app never moves money

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Ledger model | Event log (expenses + settlements) with derived balances, not a mutable balance field or full double-entry accounting | Simpler than double-entry, still auditable; matches the actual mental model of "who owes who" |
| Household scoping | Generic `Household` entity reused for both "Apartment" and "Family" rather than special-casing the parent relationship | Avoids building two different concepts for what is structurally the same problem |
| Non-login members | Members can exist without a linked auth account | Needed for Mama, who will never log in herself |
| Base currency | EUR, with original currency/amount/rate stored alongside the converted value | Preserves source-of-truth data (the original IDR amount) while enabling one unified reporting currency |
| Bank integration | None — static settlement-detail display only | Keeps the app free to run and avoids the complexity/liability of real payment execution |

---
*Generated by specs.md - fabriqa.ai FIRE Flow*

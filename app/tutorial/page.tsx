import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { BackLink } from '@/components/ui/BackLink'

type Step = {
  title: string
  body: string
}

const STEPS: Step[] = [
  {
    title: '1. Sign in',
    body: 'Sign in with Google, or get an email link — whichever you were invited with. No public signup: someone has to invite your exact email first.',
  },
  {
    title: '2. Create (or open) a household',
    body: 'A household is any group that shares money — "Apartment" for the flat, "Family" for parent reimbursements, whatever fits. You can belong to more than one, and switch between them from the dashboard.',
  },
  {
    title: '3. Add the people in it',
    body: 'Invite by email if they\'ll log in themselves. Add a "non-login member" (like Mama) if they never will — you just log entries on their behalf. Nothing about being non-login limits what they can owe or be owed.',
  },
  {
    title: '4. Log expenses as they happen',
    body: 'Rent, groceries, utilities — whoever paid, log it. It splits equally among the household by default; uncheck anyone who wasn\'t part of that one. Non-EUR amounts (like IDR) convert automatically once you give an exchange rate.',
  },
  {
    title: '5. Check the dashboard — that\'s the whole point',
    body: 'Every household shows exactly who owes who and how much, computed fresh from every expense and settlement — never a number someone typed in by hand. Click any balance to see exactly which expenses make it up, and since when.',
  },
  {
    title: '6. Get paid back',
    body: 'If someone owes you, expand their balance to see a "Pay" panel with your IBAN and a scannable QR code — any European banking app can read it and prefill the transfer. Once it\'s actually paid, either they or an admin marks it as paid, and the balance updates immediately.',
  },
  {
    title: '7. Settling up in bulk',
    body: 'Reimbursements don\'t have to match a single expense — a bulk payment (like a parent covering several months at once) is recorded the same way as any other settlement, and nets against whatever was owed at the time.',
  },
]

export default function TutorialPage() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-6 p-4 sm:gap-8 sm:p-8">
      <div className="w-full max-w-2xl">
        <BackLink href="/households" label="All households" />
      </div>
      <PageHeader
        title="How it works"
        subtitle="The whole app in seven steps — no more chasing receipts."
      />

      <div className="flex w-full max-w-2xl flex-col gap-3">
        {STEPS.map((step) => (
          <Card key={step.title}>
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">{step.title}</h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{step.body}</p>
          </Card>
        ))}
      </div>
    </main>
  )
}

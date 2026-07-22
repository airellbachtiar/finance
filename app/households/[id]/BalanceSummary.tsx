'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

type HistoryEvent = {
  type: 'expense' | 'settlement'
  date: string
  description: string
  amountEur: string
  fromMemberId: string
  toMemberId: string
}

type PaymentDetails = {
  iban: string
  beneficiaryName: string
  amountEur: string
  reference: string
  qrDataUrl: string
}

type Balance = {
  debtorMemberId: string
  creditorMemberId: string
  amountEur: string
  since: string
  history: HistoryEvent[]
  paymentDetails: PaymentDetails | null
}

type MemberOption = { id: string; displayName: string }

export function BalanceSummary({
  householdId,
  balances,
  members,
}: {
  householdId: string
  balances: Balance[]
  members: MemberOption[]
}) {
  const router = useRouter()
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [copied, setCopied] = useState<string | null>(null)
  const nameOf = (id: string) => members.find((m) => m.id === id)?.displayName ?? '(unknown)'

  function toggle(index: number) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  async function copyIban(iban: string) {
    await navigator.clipboard.writeText(iban)
    setCopied(iban)
    setTimeout(() => setCopied(null), 2000)
  }

  async function markAsPaid(b: Balance) {
    const res = await fetch(`/api/households/${householdId}/settlements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromMemberId: b.debtorMemberId,
        toMemberId: b.creditorMemberId,
        date: new Date().toISOString().slice(0, 10),
        originalCurrency: 'EUR',
        originalAmount: b.amountEur,
        notes: 'Marked as paid from dashboard',
      }),
    })
    if (res.ok) router.refresh()
  }

  if (balances.length === 0) {
    return <EmptyState>Everyone&apos;s settled up.</EmptyState>
  }

  return (
    <div className="flex w-full flex-col gap-2 overflow-x-auto">
      {balances.map((b, index) => (
        <Card key={`${b.debtorMemberId}-${b.creditorMemberId}`} className="p-0">
          <button
            onClick={() => toggle(index)}
            className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
          >
            <span className="text-neutral-900 dark:text-neutral-100">
              <strong>{nameOf(b.debtorMemberId)}</strong> owes{' '}
              <strong>{nameOf(b.creditorMemberId)}</strong>{' '}
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                €{b.amountEur}
              </span>
            </span>
            <span className="whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
              since {new Date(b.since).toLocaleDateString()}
            </span>
          </button>
          {expanded.has(index) && (
            <div className="flex flex-col gap-4 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <ul className="flex flex-col gap-1 text-sm">
                {b.history.map((h, i) => (
                  <li
                    key={i}
                    className="flex justify-between text-neutral-600 dark:text-neutral-300"
                  >
                    <span>
                      {h.type === 'expense' ? (
                        <>
                          {nameOf(h.fromMemberId)} owed {nameOf(h.toMemberId)} — {h.description}
                        </>
                      ) : (
                        <>
                          {nameOf(h.fromMemberId)} paid {nameOf(h.toMemberId)}
                          {h.description ? ` — ${h.description}` : ''}
                        </>
                      )}
                    </span>
                    <span className="whitespace-nowrap">
                      €{h.amountEur} ({new Date(h.date).toLocaleDateString()})
                    </span>
                  </li>
                ))}
              </ul>

              {b.paymentDetails && (
                <div className="flex flex-col gap-3 rounded-md border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-900 dark:bg-indigo-950 sm:flex-row sm:items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element -- inline client-generated data: URI, no benefit from next/image optimization */}
                  <img
                    src={b.paymentDetails.qrDataUrl}
                    alt="SEPA payment QR code"
                    width={110}
                    height={110}
                    className="self-center rounded bg-white p-1"
                  />
                  <div className="flex flex-1 flex-col gap-1 text-sm">
                    <p className="text-neutral-700 dark:text-neutral-300">
                      Pay <strong>{b.paymentDetails.beneficiaryName}</strong> — scan this QR in
                      your banking app, or copy the IBAN.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="rounded bg-white px-2 py-1 text-xs dark:bg-neutral-900">
                        {b.paymentDetails.iban}
                      </code>
                      <Button variant="secondary" onClick={() => copyIban(b.paymentDetails!.iban)}>
                        {copied === b.paymentDetails.iban ? 'Copied!' : 'Copy IBAN'}
                      </Button>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Reference: {b.paymentDetails.reference}
                    </p>
                    <div className="mt-1">
                      <Button onClick={() => markAsPaid(b)}>Mark as paid</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'

type HistoryEvent = {
  type: 'expense' | 'settlement'
  date: string
  description: string
  amountEur: string
  fromMemberId: string
  toMemberId: string
}

type Balance = {
  debtorMemberId: string
  creditorMemberId: string
  amountEur: string
  since: string
  history: HistoryEvent[]
}

type MemberOption = { id: string; displayName: string }

export function BalanceSummary({
  balances,
  members,
}: {
  balances: Balance[]
  members: MemberOption[]
}) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const nameOf = (id: string) => members.find((m) => m.id === id)?.displayName ?? '(unknown)'

  function toggle(index: number) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
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
            <ul className="flex flex-col gap-1 border-t border-neutral-200 px-4 py-3 text-sm dark:border-neutral-800">
              {b.history.map((h, i) => (
                <li key={i} className="flex justify-between text-neutral-600 dark:text-neutral-300">
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
          )}
        </Card>
      ))}
    </div>
  )
}

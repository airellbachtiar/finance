'use client'

import { useState } from 'react'

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
    return <p className="text-neutral-500">Everyone&apos;s settled up.</p>
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-2 overflow-x-auto">
      {balances.map((b, index) => (
        <div key={`${b.debtorMemberId}-${b.creditorMemberId}`} className="rounded border p-3">
          <button
            onClick={() => toggle(index)}
            className="flex w-full items-center justify-between text-left"
          >
            <span>
              <strong>{nameOf(b.debtorMemberId)}</strong> owes{' '}
              <strong>{nameOf(b.creditorMemberId)}</strong> €{b.amountEur}
            </span>
            <span className="text-sm text-neutral-500">
              since {new Date(b.since).toLocaleDateString()}
            </span>
          </button>
          {expanded.has(index) && (
            <ul className="mt-3 flex flex-col gap-1 border-t pt-3 text-sm">
              {b.history.map((h, i) => (
                <li key={i} className="flex justify-between">
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
                  <span>
                    €{h.amountEur} ({new Date(h.date).toLocaleDateString()})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}

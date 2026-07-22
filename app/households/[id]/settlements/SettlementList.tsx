'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

type SettlementRow = {
  id: string
  date: string
  fromMember: { displayName: string }
  toMember: { displayName: string }
  originalCurrency: string
  originalAmount: string
  convertedAmountEur: string
  notes: string | null
}

export function SettlementList({
  householdId,
  settlements,
  isAdmin,
}: {
  householdId: string
  settlements: SettlementRow[]
  isAdmin: boolean
}) {
  const router = useRouter()

  async function remove(settlementId: string) {
    const res = await fetch(`/api/households/${householdId}/settlements/${settlementId}`, {
      method: 'DELETE',
    })
    if (res.ok) router.refresh()
  }

  if (settlements.length === 0) {
    return <EmptyState>No settlements yet.</EmptyState>
  }

  return (
    <>
      {/* Mobile: stacked cards */}
      <div className="flex flex-col gap-2 sm:hidden">
        {settlements.map((s) => (
          <Card key={s.id} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {s.fromMember.displayName} → {s.toMember.displayName}
              </span>
              <span className="font-medium">€{s.convertedAmountEur}</span>
            </div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              {new Date(s.date).toLocaleDateString()}
              {s.originalCurrency !== 'EUR' && ` · ${s.originalAmount} ${s.originalCurrency}`}
            </div>
            {s.notes && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{s.notes}</p>
            )}
            {isAdmin && (
              <div className="mt-1">
                <Button variant="danger" onClick={() => remove(s.id)}>
                  Delete
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Desktop: table */}
      <Card className="hidden overflow-x-auto p-0 sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              <th className="p-3 font-medium">Date</th>
              <th className="p-3 font-medium">From</th>
              <th className="p-3 font-medium">To</th>
              <th className="p-3 font-medium">Amount</th>
              <th className="p-3 font-medium">EUR</th>
              <th className="p-3 font-medium">Notes</th>
              {isAdmin && <th className="p-3"></th>}
            </tr>
          </thead>
          <tbody>
            {settlements.map((s) => (
              <tr
                key={s.id}
                className="border-b border-neutral-100 last:border-0 dark:border-neutral-800"
              >
                <td className="p-3 text-neutral-500 dark:text-neutral-400">
                  {new Date(s.date).toLocaleDateString()}
                </td>
                <td className="p-3 text-neutral-900 dark:text-neutral-100">
                  {s.fromMember.displayName}
                </td>
                <td className="p-3 text-neutral-900 dark:text-neutral-100">
                  {s.toMember.displayName}
                </td>
                <td className="p-3">
                  {s.originalAmount} {s.originalCurrency}
                </td>
                <td className="p-3 font-medium">€{s.convertedAmountEur}</td>
                <td className="p-3 text-neutral-500 dark:text-neutral-400">{s.notes ?? ''}</td>
                {isAdmin && (
                  <td className="p-3">
                    <Button variant="danger" onClick={() => remove(s.id)}>
                      Delete
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  )
}

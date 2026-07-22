'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

type ExpenseRow = {
  id: string
  date: string
  category: string
  payer: { displayName: string }
  originalCurrency: string
  originalAmount: string
  convertedAmountEur: string
  notes: string | null
  splits: { memberId: string; shareEur: string }[]
}

export function ExpenseList({
  householdId,
  expenses,
}: {
  householdId: string
  expenses: ExpenseRow[]
}) {
  const router = useRouter()
  const [removingId, setRemovingId] = useState<string | null>(null)

  async function remove(expense: ExpenseRow) {
    if (!window.confirm(`Delete "${expense.category}" (€${expense.convertedAmountEur})?`)) return
    setRemovingId(expense.id)
    const res = await fetch(`/api/households/${householdId}/expenses/${expense.id}`, {
      method: 'DELETE',
    })
    if (res.ok) router.refresh()
    setRemovingId(null)
  }

  if (expenses.length === 0) {
    return <EmptyState>No expenses logged yet — add the first one below.</EmptyState>
  }

  return (
    <>
      {/* Mobile: stacked cards */}
      <div className="flex flex-col gap-2 sm:hidden">
        {expenses.map((e) => (
          <Card key={e.id} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {e.category}
              </span>
              <span className="font-medium">€{e.convertedAmountEur}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
              <span>
                {e.payer.displayName} · {new Date(e.date).toLocaleDateString()}
              </span>
              <span>
                {e.splits.length} member{e.splits.length === 1 ? '' : 's'}
              </span>
            </div>
            {e.originalCurrency !== 'EUR' && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {e.originalAmount} {e.originalCurrency}
              </p>
            )}
            <div className="mt-1">
              <Button variant="danger" onClick={() => remove(e)} disabled={removingId === e.id}>
                {removingId === e.id ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop: table */}
      <Card className="hidden overflow-x-auto p-0 sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              <th className="p-3 font-medium">Date</th>
              <th className="p-3 font-medium">Category</th>
              <th className="p-3 font-medium">Paid by</th>
              <th className="p-3 font-medium">Amount</th>
              <th className="p-3 font-medium">EUR</th>
              <th className="p-3 font-medium">Split</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr
                key={e.id}
                className="border-b border-neutral-100 last:border-0 dark:border-neutral-800"
              >
                <td className="p-3 text-neutral-500 dark:text-neutral-400">
                  {new Date(e.date).toLocaleDateString()}
                </td>
                <td className="p-3 text-neutral-900 dark:text-neutral-100">{e.category}</td>
                <td className="p-3">{e.payer.displayName}</td>
                <td className="p-3">
                  {e.originalAmount} {e.originalCurrency}
                </td>
                <td className="p-3 font-medium">€{e.convertedAmountEur}</td>
                <td className="p-3 text-neutral-500 dark:text-neutral-400">
                  {e.splits.length} member{e.splits.length === 1 ? '' : 's'}
                </td>
                <td className="p-3">
                  <Button variant="danger" onClick={() => remove(e)} disabled={removingId === e.id}>
                    {removingId === e.id ? 'Deleting…' : 'Delete'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  )
}

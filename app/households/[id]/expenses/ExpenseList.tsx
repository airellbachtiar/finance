'use client'

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

  async function remove(expenseId: string) {
    const res = await fetch(`/api/households/${householdId}/expenses/${expenseId}`, {
      method: 'DELETE',
    })
    if (res.ok) router.refresh()
  }

  if (expenses.length === 0) {
    return <EmptyState>No expenses yet.</EmptyState>
  }

  return (
    <Card className="overflow-x-auto p-0">
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
                <Button variant="danger" onClick={() => remove(e.id)}>
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

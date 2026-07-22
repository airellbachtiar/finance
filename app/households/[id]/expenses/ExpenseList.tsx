'use client'

import { useRouter } from 'next/navigation'

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
    return <p className="text-neutral-500">No expenses yet.</p>
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b">
          <th className="p-2">Date</th>
          <th className="p-2">Category</th>
          <th className="p-2">Paid by</th>
          <th className="p-2">Amount</th>
          <th className="p-2">EUR</th>
          <th className="p-2">Split</th>
          <th className="p-2"></th>
        </tr>
      </thead>
      <tbody>
        {expenses.map((e) => (
          <tr key={e.id} className="border-b">
            <td className="p-2">{new Date(e.date).toLocaleDateString()}</td>
            <td className="p-2">{e.category}</td>
            <td className="p-2">{e.payer.displayName}</td>
            <td className="p-2">
              {e.originalAmount} {e.originalCurrency}
            </td>
            <td className="p-2">€{e.convertedAmountEur}</td>
            <td className="p-2">{e.splits.length} member(s)</td>
            <td className="p-2">
              <button onClick={() => remove(e.id)} className="text-red-600 underline">
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

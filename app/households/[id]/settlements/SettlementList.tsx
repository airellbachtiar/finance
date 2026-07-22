'use client'

import { useRouter } from 'next/navigation'

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
    return <p className="text-neutral-500">No settlements yet.</p>
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b">
          <th className="p-2">Date</th>
          <th className="p-2">From</th>
          <th className="p-2">To</th>
          <th className="p-2">Amount</th>
          <th className="p-2">EUR</th>
          <th className="p-2">Notes</th>
          {isAdmin && <th className="p-2"></th>}
        </tr>
      </thead>
      <tbody>
        {settlements.map((s) => (
          <tr key={s.id} className="border-b">
            <td className="p-2">{new Date(s.date).toLocaleDateString()}</td>
            <td className="p-2">{s.fromMember.displayName}</td>
            <td className="p-2">{s.toMember.displayName}</td>
            <td className="p-2">
              {s.originalAmount} {s.originalCurrency}
            </td>
            <td className="p-2">€{s.convertedAmountEur}</td>
            <td className="p-2">{s.notes ?? ''}</td>
            {isAdmin && (
              <td className="p-2">
                <button onClick={() => remove(s.id)} className="text-red-600 underline">
                  Delete
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

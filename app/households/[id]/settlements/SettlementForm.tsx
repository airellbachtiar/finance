'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type MemberOption = { id: string; displayName: string }

export function SettlementForm({
  householdId,
  members,
}: {
  householdId: string
  members: MemberOption[]
}) {
  const router = useRouter()
  const [fromMemberId, setFromMemberId] = useState(members[0]?.id ?? '')
  const [toMemberId, setToMemberId] = useState(members[1]?.id ?? members[0]?.id ?? '')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [originalCurrency, setOriginalCurrency] = useState('EUR')
  const [originalAmount, setOriginalAmount] = useState('')
  const [exchangeRate, setExchangeRate] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch(`/api/households/${householdId}/settlements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromMemberId,
        toMemberId,
        date,
        originalCurrency,
        originalAmount,
        exchangeRate: originalCurrency === 'EUR' ? null : exchangeRate,
        notes,
      }),
    })
    if (res.ok) {
      setOriginalAmount('')
      setExchangeRate('')
      setNotes('')
      setStatus(null)
      router.refresh()
    } else {
      const body = await res.json().catch(() => null)
      setStatus(body?.error ?? 'Failed to add settlement')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded border p-4">
      <div className="flex gap-2">
        <select
          value={fromMemberId}
          onChange={(e) => setFromMemberId(e.target.value)}
          className="rounded border px-3 py-2 text-black"
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.displayName}
            </option>
          ))}
        </select>
        <span className="self-center">paid</span>
        <select
          value={toMemberId}
          onChange={(e) => setToMemberId(e.target.value)}
          className="rounded border px-3 py-2 text-black"
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.displayName}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded border px-3 py-2 text-black"
        />
        <select
          value={originalCurrency}
          onChange={(e) => setOriginalCurrency(e.target.value)}
          className="rounded border px-3 py-2 text-black"
        >
          <option value="EUR">EUR</option>
          <option value="IDR">IDR</option>
        </select>
        <input
          type="number"
          step="0.01"
          required
          value={originalAmount}
          onChange={(e) => setOriginalAmount(e.target.value)}
          placeholder="Amount"
          className="rounded border px-3 py-2 text-black"
        />
        {originalCurrency !== 'EUR' && (
          <input
            type="number"
            step="0.000001"
            required
            value={exchangeRate}
            onChange={(e) => setExchangeRate(e.target.value)}
            placeholder={`1 EUR = ? ${originalCurrency}`}
            className="rounded border px-3 py-2 text-black"
          />
        )}
      </div>
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="rounded border px-3 py-2 text-black"
      />
      <button type="submit" className="rounded bg-black px-4 py-2 text-white">
        Record settlement
      </button>
      {status && <p className="text-sm text-red-600">{status}</p>}
    </form>
  )
}

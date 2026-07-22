'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type MemberOption = { id: string; displayName: string }

export function ExpenseForm({
  householdId,
  members,
}: {
  householdId: string
  members: MemberOption[]
}) {
  const router = useRouter()
  const [payerId, setPayerId] = useState(members[0]?.id ?? '')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [originalCurrency, setOriginalCurrency] = useState('EUR')
  const [originalAmount, setOriginalAmount] = useState('')
  const [exchangeRate, setExchangeRate] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(members.map((m) => m.id))
  const [status, setStatus] = useState<string | null>(null)

  function toggleMember(id: string) {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch(`/api/households/${householdId}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payerId,
        category,
        date,
        originalCurrency,
        originalAmount,
        exchangeRate: originalCurrency === 'EUR' ? null : exchangeRate,
        notes,
        memberIds: selectedMemberIds,
      }),
    })
    if (res.ok) {
      setCategory('')
      setOriginalAmount('')
      setExchangeRate('')
      setNotes('')
      setStatus(null)
      router.refresh()
    } else {
      const body = await res.json().catch(() => null)
      setStatus(body?.error ?? 'Failed to add expense')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded border p-4">
      <div className="flex gap-2">
        <select
          value={payerId}
          onChange={(e) => setPayerId(e.target.value)}
          className="rounded border px-3 py-2 text-black"
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.displayName}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded border px-3 py-2 text-black"
        />
        <input
          type="text"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category (e.g. Rent)"
          className="rounded border px-3 py-2 text-black"
        />
      </div>
      <div className="flex gap-2">
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
      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm text-neutral-500">Split equally between:</legend>
        {members.map((m) => (
          <label key={m.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selectedMemberIds.includes(m.id)}
              onChange={() => toggleMember(m.id)}
            />
            {m.displayName}
          </label>
        ))}
      </fieldset>
      <button type="submit" className="rounded bg-black px-4 py-2 text-white">
        Add expense
      </button>
      {status && <p className="text-sm text-red-600">{status}</p>}
    </form>
  )
}

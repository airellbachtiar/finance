'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

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
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Select value={payerId} onChange={(e) => setPayerId(e.target.value)}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.displayName}
              </option>
            ))}
          </Select>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input
            type="text"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category (e.g. Rent)"
          />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Select
            value={originalCurrency}
            onChange={(e) => setOriginalCurrency(e.target.value)}
          >
            <option value="EUR">EUR</option>
            <option value="IDR">IDR</option>
          </Select>
          <Input
            type="number"
            step="0.01"
            required
            value={originalAmount}
            onChange={(e) => setOriginalAmount(e.target.value)}
            placeholder="Amount"
          />
          {originalCurrency !== 'EUR' && (
            <Input
              type="number"
              step="0.000001"
              required
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
              placeholder={`1 EUR = ? ${originalCurrency}`}
            />
          )}
        </div>
        <Input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
        />
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-sm text-neutral-500 dark:text-neutral-400">
            Split equally between:
          </legend>
          <div className="flex flex-wrap gap-4">
            {members.map((m) => (
              <label
                key={m.id}
                className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300"
              >
                <input
                  type="checkbox"
                  checked={selectedMemberIds.includes(m.id)}
                  onChange={() => toggleMember(m.id)}
                  className="accent-indigo-600"
                />
                {m.displayName}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <Button type="submit">Add expense</Button>
        </div>
        {status && <p className="text-sm text-red-600">{status}</p>}
      </form>
    </Card>
  )
}

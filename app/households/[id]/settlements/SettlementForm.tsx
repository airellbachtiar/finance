'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'

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
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
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
    setSubmitting(false)
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-1 flex-col gap-1">
            <Label htmlFor="settlement-from">From</Label>
            <Select
              id="settlement-from"
              value={fromMemberId}
              onChange={(e) => setFromMemberId(e.target.value)}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.displayName}
                </option>
              ))}
            </Select>
          </div>
          <span className="pb-2 text-sm text-neutral-500 dark:text-neutral-400">paid</span>
          <div className="flex flex-1 flex-col gap-1">
            <Label htmlFor="settlement-to">To</Label>
            <Select
              id="settlement-to"
              value={toMemberId}
              onChange={(e) => setToMemberId(e.target.value)}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.displayName}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="settlement-date">Date</Label>
            <Input
              id="settlement-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="settlement-currency">Currency</Label>
            <Select
              id="settlement-currency"
              value={originalCurrency}
              onChange={(e) => setOriginalCurrency(e.target.value)}
            >
              <option value="EUR">EUR</option>
              <option value="IDR">IDR</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="settlement-amount">Amount</Label>
            <Input
              id="settlement-amount"
              type="number"
              step="0.01"
              required
              value={originalAmount}
              onChange={(e) => setOriginalAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>
        {originalCurrency !== 'EUR' && (
          <div className="flex flex-col gap-1">
            <Label htmlFor="settlement-rate">Exchange rate</Label>
            <Input
              id="settlement-rate"
              type="number"
              step="0.000001"
              required
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
              placeholder={`1 EUR = ? ${originalCurrency}`}
            />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <Label htmlFor="settlement-notes">Notes</Label>
          <Input
            id="settlement-notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Recording…' : 'Record settlement'}
          </Button>
        </div>
        {status && <p className="text-sm text-red-600">{status}</p>}
      </form>
    </Card>
  )
}

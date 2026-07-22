import { describe, it, expect } from 'vitest'
import { convertToEur } from './currency'

describe('convertToEur', () => {
  it('passes EUR amounts through unchanged', () => {
    expect(convertToEur(90, 'EUR', null).toString()).toBe('90')
  })

  it('converts a non-EUR amount using the given rate', () => {
    // 1 EUR = 18500 IDR, so 2,500,000 IDR -> ~135.14 EUR
    const result = convertToEur(2500000, 'IDR', 18500)
    expect(result.toString()).toBe('135.14')
  })

  it('throws when a non-EUR amount has no exchange rate', () => {
    expect(() => convertToEur(2500000, 'IDR', null)).toThrow('Exchange rate is required')
  })
})

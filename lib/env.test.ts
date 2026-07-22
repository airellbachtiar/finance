import { describe, it, expect, afterEach } from 'vitest'
import { getDatabaseUrl } from './env'

describe('getDatabaseUrl', () => {
  const original = process.env.DATABASE_URL

  afterEach(() => {
    process.env.DATABASE_URL = original
  })

  it('returns the connection string when set', () => {
    process.env.DATABASE_URL = 'postgresql://example'
    expect(getDatabaseUrl()).toBe('postgresql://example')
  })

  it('throws when DATABASE_URL is missing', () => {
    delete process.env.DATABASE_URL
    expect(() => getDatabaseUrl()).toThrow('DATABASE_URL is not set')
  })
})

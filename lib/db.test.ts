import { describe, it, expect } from 'vitest'
import { prisma } from './db'

describe('prisma client', () => {
  it('is instantiated as a singleton and can reach the database', async () => {
    expect(prisma).toBeDefined()
    await expect(prisma.$queryRaw`SELECT 1`).resolves.toBeDefined()
  })
})

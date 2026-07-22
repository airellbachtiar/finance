import { Prisma } from '@prisma/client'
import { prisma } from './db'
import { convertToEur } from './currency'

type DecimalInput = Prisma.Decimal | number | string

type SettlementInput = {
  householdId: string
  fromMemberId: string
  toMemberId: string
  date: Date
  notes?: string
  originalCurrency: string
  originalAmount: DecimalInput
  exchangeRate?: DecimalInput | null
}

async function validateMembers(householdId: string, fromMemberId: string, toMemberId: string) {
  if (fromMemberId === toMemberId) {
    throw new Error('A member cannot settle with themselves')
  }

  const members = await prisma.member.findMany({
    where: { id: { in: [fromMemberId, toMemberId] }, householdId },
  })
  if (members.length !== 2) {
    throw new Error('Both members must belong to the settlement’s household')
  }
}

export async function createSettlement(input: SettlementInput) {
  await validateMembers(input.householdId, input.fromMemberId, input.toMemberId)

  const convertedAmountEur = convertToEur(
    input.originalAmount,
    input.originalCurrency,
    input.exchangeRate ?? null
  )

  return prisma.settlement.create({
    data: {
      householdId: input.householdId,
      fromMemberId: input.fromMemberId,
      toMemberId: input.toMemberId,
      date: input.date,
      notes: input.notes,
      originalCurrency: input.originalCurrency,
      originalAmount: new Prisma.Decimal(input.originalAmount),
      exchangeRate: input.exchangeRate != null ? new Prisma.Decimal(input.exchangeRate) : null,
      convertedAmountEur,
    },
  })
}

export async function updateSettlement(settlementId: string, input: SettlementInput) {
  await validateMembers(input.householdId, input.fromMemberId, input.toMemberId)

  const convertedAmountEur = convertToEur(
    input.originalAmount,
    input.originalCurrency,
    input.exchangeRate ?? null
  )

  return prisma.settlement.update({
    where: { id: settlementId },
    data: {
      fromMemberId: input.fromMemberId,
      toMemberId: input.toMemberId,
      date: input.date,
      notes: input.notes,
      originalCurrency: input.originalCurrency,
      originalAmount: new Prisma.Decimal(input.originalAmount),
      exchangeRate: input.exchangeRate != null ? new Prisma.Decimal(input.exchangeRate) : null,
      convertedAmountEur,
    },
  })
}

export async function deleteSettlement(settlementId: string) {
  await prisma.settlement.delete({ where: { id: settlementId } })
}

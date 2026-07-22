import { Prisma } from '@prisma/client'
import { prisma } from './db'
import { convertToEur } from './currency'

type DecimalInput = Prisma.Decimal | number | string

type SplitInput = { memberId: string; shareEur: DecimalInput }

type ExpenseInput = {
  householdId: string
  payerId: string
  date: Date
  category: string
  notes?: string
  originalCurrency: string
  originalAmount: DecimalInput
  exchangeRate?: DecimalInput | null
  splits?: SplitInput[]
  memberIds?: string[]
}

export async function createExpense(input: ExpenseInput) {
  const convertedAmountEur = convertToEur(
    input.originalAmount,
    input.originalCurrency,
    input.exchangeRate ?? null
  )
  const splits = await resolveSplits(input.householdId, convertedAmountEur, input.splits, input.memberIds)

  return prisma.expense.create({
    data: {
      householdId: input.householdId,
      payerId: input.payerId,
      date: input.date,
      category: input.category,
      notes: input.notes,
      originalCurrency: input.originalCurrency,
      originalAmount: new Prisma.Decimal(input.originalAmount),
      exchangeRate: input.exchangeRate != null ? new Prisma.Decimal(input.exchangeRate) : null,
      convertedAmountEur,
      splits: {
        create: splits.map((s) => ({ memberId: s.memberId, shareEur: s.shareEur })),
      },
    },
    include: { splits: true },
  })
}

export async function updateExpense(expenseId: string, input: ExpenseInput) {
  const convertedAmountEur = convertToEur(
    input.originalAmount,
    input.originalCurrency,
    input.exchangeRate ?? null
  )
  const splits = await resolveSplits(input.householdId, convertedAmountEur, input.splits, input.memberIds)

  return prisma.$transaction(async (tx) => {
    await tx.expenseSplit.deleteMany({ where: { expenseId } })
    return tx.expense.update({
      where: { id: expenseId },
      data: {
        payerId: input.payerId,
        date: input.date,
        category: input.category,
        notes: input.notes,
        originalCurrency: input.originalCurrency,
        originalAmount: new Prisma.Decimal(input.originalAmount),
        exchangeRate: input.exchangeRate != null ? new Prisma.Decimal(input.exchangeRate) : null,
        convertedAmountEur,
        splits: {
          create: splits.map((s) => ({ memberId: s.memberId, shareEur: s.shareEur })),
        },
      },
      include: { splits: true },
    })
  })
}

export async function deleteExpense(expenseId: string) {
  await prisma.expense.delete({ where: { id: expenseId } })
}

async function assertMembersBelongToHousehold(householdId: string, memberIds: string[]) {
  const count = await prisma.member.count({
    where: { id: { in: memberIds }, householdId },
  })
  if (count !== memberIds.length) {
    throw new Error('All split members must belong to the expense’s household')
  }
}

async function resolveSplits(
  householdId: string,
  total: Prisma.Decimal,
  explicitSplits?: SplitInput[],
  memberIds?: string[]
): Promise<{ memberId: string; shareEur: Prisma.Decimal }[]> {
  if (explicitSplits && explicitSplits.length > 0) {
    const resolved = explicitSplits.map((s) => ({
      memberId: s.memberId,
      shareEur: new Prisma.Decimal(s.shareEur),
    }))
    await assertMembersBelongToHousehold(
      householdId,
      resolved.map((s) => s.memberId)
    )
    const sum = resolved.reduce((acc, s) => acc.plus(s.shareEur), new Prisma.Decimal(0))
    if (!sum.equals(total)) {
      throw new Error(`Splits must sum to the expense total (${total.toString()}), got ${sum.toString()}`)
    }
    return resolved
  }

  if (memberIds && memberIds.length > 0) {
    await assertMembersBelongToHousehold(householdId, memberIds)
  }

  const targetMemberIds =
    memberIds && memberIds.length > 0
      ? memberIds
      : (await prisma.member.findMany({ where: { householdId }, select: { id: true } })).map((m) => m.id)

  if (targetMemberIds.length === 0) {
    throw new Error('Household has no members to split an expense among')
  }

  return equalSplit(total, targetMemberIds)
}

function equalSplit(
  total: Prisma.Decimal,
  memberIds: string[]
): { memberId: string; shareEur: Prisma.Decimal }[] {
  const totalCents = total.mul(100).round()
  const count = memberIds.length
  const baseShareCents = totalCents.dividedToIntegerBy(count)
  const remainder = totalCents.minus(baseShareCents.mul(count)).toNumber()

  return memberIds.map((memberId, index) => {
    const shareCents = index < remainder ? baseShareCents.plus(1) : baseShareCents
    return { memberId, shareEur: shareCents.dividedBy(100) }
  })
}

import { Prisma } from '@prisma/client'

type DecimalInput = Prisma.Decimal | number | string

export function convertToEur(
  amount: DecimalInput,
  currency: string,
  rate: DecimalInput | null | undefined
): Prisma.Decimal {
  const amt = new Prisma.Decimal(amount)

  if (currency === 'EUR') {
    return amt.toDecimalPlaces(2)
  }

  if (rate === null || rate === undefined) {
    throw new Error(`Exchange rate is required for non-EUR currency: ${currency}`)
  }

  return amt.dividedBy(new Prisma.Decimal(rate)).toDecimalPlaces(2)
}

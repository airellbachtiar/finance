import QRCode from 'qrcode'
import { prisma } from './db'

export type PaymentDetails = {
  iban: string
  beneficiaryName: string
  amountEur: string
  reference: string
  qrDataUrl: string
}

/**
 * Builds a SEPA/EPC069-12 QR payload — the open standard every European
 * banking app (ING included) scans natively to prefill a transfer. No
 * registration with any bank/provider needed, unlike Tikkie or a PSD2
 * payment-request API.
 */
function buildEpcQrPayload(params: {
  iban: string
  beneficiaryName: string
  amountEur: string
  reference: string
}): string {
  const { iban, beneficiaryName, amountEur, reference } = params
  return [
    'BCD',
    '002',
    '1',
    'SCT',
    '',
    beneficiaryName.slice(0, 70),
    iban.replace(/\s+/g, ''),
    `EUR${amountEur}`,
    '',
    '',
    reference.slice(0, 140),
  ].join('\n')
}

/**
 * Payment details for settling a specific balance: the creditor's IBAN
 * (from their User if they're a login member, or their Member record if
 * not), a SEPA QR code, and a reference. Returns null if the creditor
 * hasn't added an IBAN yet.
 */
export async function getPaymentDetails(
  householdId: string,
  creditorMemberId: string,
  amountEur: string,
  householdName: string
): Promise<PaymentDetails | null> {
  const creditor = await prisma.member.findUnique({
    where: { id: creditorMemberId },
    include: { user: true },
  })
  if (!creditor || creditor.householdId !== householdId) return null

  const iban = creditor.user?.iban ?? creditor.iban
  if (!iban) return null

  const beneficiaryName = creditor.displayName
  const reference = `${householdName} balance`
  const payload = buildEpcQrPayload({ iban, beneficiaryName, amountEur, reference })
  const qrDataUrl = await QRCode.toDataURL(payload, { margin: 1, width: 220 })

  return { iban, beneficiaryName, amountEur, reference, qrDataUrl }
}

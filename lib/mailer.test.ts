import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const sendMail = vi.fn().mockResolvedValue(undefined)
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail })),
  },
}))

import { sendInviteEmail } from './mailer'

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  sendMail.mockClear()
  process.env.EMAIL_SERVER = 'smtp://user:pass@smtp.example.com:587'
  process.env.EMAIL_FROM = 'Bachtiar Ledger <noreply@example.com>'
  process.env.NEXTAUTH_URL = 'https://airell.moe'
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('sendInviteEmail', () => {
  it('throws when EMAIL_SERVER/EMAIL_FROM are not configured', async () => {
    delete process.env.EMAIL_SERVER
    await expect(sendInviteEmail('someone@example.com')).rejects.toThrow('not configured')
  })

  it('sends to the invited email with a sign-in link', async () => {
    await sendInviteEmail('someone@example.com')
    expect(sendMail).toHaveBeenCalledTimes(1)
    const call = sendMail.mock.calls[0][0]
    expect(call.to).toBe('someone@example.com')
    expect(call.from).toBe('Bachtiar Ledger <noreply@example.com>')
    expect(call.text).toContain('https://airell.moe/signin')
    expect(call.html).toContain('https://airell.moe/signin')
  })

  it('includes and HTML-escapes the household name when given', async () => {
    await sendInviteEmail('someone@example.com', 'Bros & <Sis>')
    const call = sendMail.mock.calls[0][0]
    expect(call.subject).toContain('Bros & <Sis>')
    expect(call.html).toContain('Bros &amp; &lt;Sis&gt;')
    expect(call.html).not.toContain('<Sis>')
  })
})

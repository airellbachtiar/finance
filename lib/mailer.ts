import nodemailer from 'nodemailer'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Notifies an invited email that they can now sign in. Creating an Invite
 * record only *permits* sign-in — without this, nobody actually finds out
 * they were invited unless the admin tells them separately.
 */
export async function sendInviteEmail(toEmail: string, householdName?: string): Promise<void> {
  if (!process.env.EMAIL_SERVER || !process.env.EMAIL_FROM) {
    throw new Error('EMAIL_SERVER/EMAIL_FROM is not configured')
  }

  const transport = nodemailer.createTransport(process.env.EMAIL_SERVER)
  const signInUrl = process.env.NEXTAUTH_URL
    ? `${process.env.NEXTAUTH_URL}/signin`
    : 'https://airell.moe/signin'

  const subject = householdName
    ? `You've been invited to "${householdName}" on Bachtiar Ledger`
    : "You've been invited to Bachtiar Ledger"

  const householdLine = householdName ? ` for "${escapeHtml(householdName)}"` : ''

  await transport.sendMail({
    to: toEmail,
    from: process.env.EMAIL_FROM,
    subject,
    text: `You've been invited to Bachtiar Ledger${householdName ? ` for "${householdName}"` : ''}.\n\nSign in here: ${signInUrl}\n\nUse this exact email address (${toEmail}) — sign in with Google, or request an email link.`,
    html: `
      <p>You've been invited to <strong>Bachtiar Ledger</strong>${householdLine}.</p>
      <p><a href="${signInUrl}">Sign in here</a></p>
      <p>Use this exact email address (<strong>${escapeHtml(toEmail)}</strong>) — sign in with Google, or request an email link.</p>
    `,
  })
}

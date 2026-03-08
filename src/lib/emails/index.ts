import { Resend } from 'resend'
import { WillkommenEmail } from './willkommen'
import { ZahlungFehlgeschlagenEmail } from './zahlung-fehlgeschlagen'
import { AboGekuendigtEmail } from './abo-gekuendigt'
import { TestphaseEndetEmail } from './testphase-endet'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM || 'noreply@uncuttv.at'

export async function sendWillkommenEmail(email: string) {
  return resend.emails.send({
    from: `UncutTV <${FROM}>`,
    to: email,
    subject: 'Willkommen bei UncutTV – Deine 7 Tage beginnen jetzt',
    html: WillkommenEmail({ email }),
  })
}

export async function sendZahlungFehlgeschlagenEmail(email: string) {
  return resend.emails.send({
    from: `UncutTV <${FROM}>`,
    to: email,
    subject: 'Zahlung fehlgeschlagen – Bitte Zahlungsmethode aktualisieren',
    html: ZahlungFehlgeschlagenEmail({ email }),
  })
}

export async function sendAboGekuendigtEmail(email: string, endDate: string) {
  return resend.emails.send({
    from: `UncutTV <${FROM}>`,
    to: email,
    subject: 'Dein UncutTV-Abo wurde gekündigt',
    html: AboGekuendigtEmail({ email, endDate }),
  })
}

export async function sendTestphaseEndetEmail(email: string, endDate: string) {
  return resend.emails.send({
    from: `UncutTV <${FROM}>`,
    to: email,
    subject: 'Deine UncutTV-Testphase endet bald',
    html: TestphaseEndetEmail({ email, endDate }),
  })
}

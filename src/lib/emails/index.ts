import { Resend } from 'resend'
import { RegistrierungEmail } from './registrierung'
import { WillkommenEmail } from './willkommen'
import { ZahlungFehlgeschlagenEmail } from './zahlung-fehlgeschlagen'
import { AboGekuendigtEmail } from './abo-gekuendigt'
import { TestphaseEndetEmail } from './testphase-endet'
import { VerifikationAusstehendEmail } from './verifikation-ausstehend'
import { PinResetEmail } from './pin-reset'
import { InternNotificationEmail } from './intern'
import {
  KuendigungBestaetigungEmail,
  KuendigungInternEmail,
  type CancellationSummary,
} from './kuendigung'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM || 'noreply@uncuttv.at'

export async function sendRegistrierungEmail(
  email: string,
  legalVersion: string,
  acceptedAt: string
) {
  return resend.emails.send({
    from: `UncutTV <${FROM}>`,
    to: email,
    subject: 'Deine Registrierung bei UncutTV',
    html: RegistrierungEmail({ email, legalVersion, acceptedAt }),
  })
}

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

export async function sendVerifikationAusstehendEmail(email: string, endDate: string) {
  return resend.emails.send({
    from: `UncutTV <${FROM}>`,
    to: email,
    subject: 'Altersverifikation fehlt – dein Zugang endet sonst',
    html: VerifikationAusstehendEmail({ email, endDate }),
  })
}

/** Empfaenger aller internen Benachrichtigungen. */
const CANCELLATION_NOTIFY = 'office@uncuttv.at'

/**
 * Interne Meldung ans Backoffice. Fehlschlaege werden geloggt, nicht geworfen
 * -- ein Webhook darf daran nicht scheitern und von Stripe wiederholt werden.
 */
export async function sendInternNotification(
  subject: string,
  title: string,
  intro: string,
  rows: { label: string; value: string }[]
) {
  return resend.emails.send({
    from: `UncutTV <${FROM}>`,
    to: CANCELLATION_NOTIFY,
    subject,
    html: InternNotificationEmail({ title, intro, rows }),
  })
}

export async function sendKuendigungBestaetigungEmail(
  email: string,
  summary: CancellationSummary
) {
  return resend.emails.send({
    from: `UncutTV <${FROM}>`,
    to: email,
    subject: 'Bestätigung deiner Kündigung – UncutTV',
    html: KuendigungBestaetigungEmail(summary),
  })
}

export async function sendKuendigungInternEmail(
  summary: CancellationSummary & { locale: string; ip: string | null }
) {
  return resend.emails.send({
    from: `UncutTV <${FROM}>`,
    to: CANCELLATION_NOTIFY,
    subject: 'Neue Kündigung eingegangen – manuell bearbeiten',
    html: KuendigungInternEmail(summary),
  })
}

export async function sendPinResetEmail(email: string, code: string) {
  return resend.emails.send({
    from: `UncutTV <${FROM}>`,
    to: email,
    subject: 'UncutTV – Dein PIN Reset Code',
    html: PinResetEmail({ code }),
  })
}

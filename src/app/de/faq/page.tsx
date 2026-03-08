'use client'

import Link from 'next/link'
import { useState } from 'react'

const FAQS = [
  {
    frage: 'Was ist UncutTV?',
    antwort: 'UncutTV ist Europas erste Streaming-Plattform speziell für Independent-Horror und Extremkino. Wir bieten ein kuratiertes Angebot an unabhängigen Filmen, die du sonst nirgendwo streamst – fair für Filmemacher, ungefiltert für Fans.',
  },
  {
    frage: 'Für wen ist UncutTV?',
    antwort: 'UncutTV richtet sich ausschließlich an Erwachsene ab 18 Jahren. Alle Nutzer müssen eine Altersverifikation durchlaufen, bevor sie auf Inhalte zugreifen können.',
  },
  {
    frage: 'Was kostet UncutTV?',
    antwort: 'Du startest mit 7 Tagen kostenlos. Danach kostet das Abo €19,90 pro Monat – monatlich kündbar, keine Mindestlaufzeit.',
  },
  {
    frage: 'Wie funktioniert die Altersverifikation?',
    antwort: 'Bei der Registrierung wirst du aufgefordert, deinen Ausweis über unseren Partner Veriff zu verifizieren. Das dauert ca. 2 Minuten. Ohne erfolgreiche Verifikation ist kein Zugang möglich.',
  },
  {
    frage: 'Kann ich jederzeit kündigen?',
    antwort: 'Ja. Du kannst dein Abo jederzeit über „Mein Konto" kündigen. Du hast bis zum Ende des bezahlten Zeitraums weiterhin vollen Zugang. Es entstehen keine weiteren Kosten.',
  },
  {
    frage: 'In welchen Ländern ist UncutTV verfügbar?',
    antwort: 'UncutTV ist ein österreichischer Dienst und primär für den DACH-Raum (Deutschland, Österreich, Schweiz) ausgerichtet. Einzelne Titel können aufgrund von Lizenzbestimmungen in Deutschland eingeschränkt sein.',
  },
  {
    frage: 'Wie werden Filmemacher bezahlt?',
    antwort: 'UncutTV verteilt 60% der Einnahmen an Filmemacher, basierend auf der tatsächlichen Watchtime ihrer Filme. Die Abrechnung erfolgt monatlich.',
  },
  {
    frage: 'Auf welchen Geräten kann ich UncutTV nutzen?',
    antwort: 'UncutTV ist aktuell über den Webbrowser auf Desktop und Mobil verfügbar. Apps für iOS, Android und Smart TV sind in Entwicklung.',
  },
  {
    frage: 'Ich habe ein Problem mit meiner Zahlung – was tun?',
    antwort: 'Geh zu „Mein Konto" und klicke auf „Zahlungsmethode verwalten". Dort kannst du deine Kreditkarte aktualisieren. Bei weiteren Fragen: office@uncuttv.at',
  },
  {
    frage: 'Wie kann ich einen Film einreichen?',
    antwort: 'Filmemacher können sich über office@uncuttv.at melden. Wir prüfen jede Einreichung und melden uns innerhalb von 14 Tagen.',
  },
]

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)' }}>

      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 48px',
        background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Link href="/de" style={{
          fontFamily: 'var(--font-display)', fontSize: '1.8rem',
          letterSpacing: '0.08em', color: 'var(--warm-white)', textDecoration: 'none',
        }}>
          UNCUT<span style={{ color: 'var(--red)' }}>TV</span>
        </Link>
        <Link href="/de" style={{
          fontSize: '0.82rem', color: 'var(--grey)',
          textDecoration: 'none', letterSpacing: '0.06em',
        }}>
          {'← Zurück'}
        </Link>
      </nav>

      <div style={{ padding: '120px 48px 80px', maxWidth: '720px', margin: '0 auto' }}>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '2.5rem',
          letterSpacing: '0.06em', color: 'var(--warm-white)', marginBottom: '8px',
        }}>
          FAQ
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--grey)', marginBottom: '48px' }}>
          Häufig gestellte Fragen
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {FAQS.map((faq, i) => (
            <div
              key={i}
              style={{
                border: `1px solid ${open === i ? 'rgba(229,9,20,0.3)' : 'rgba(255,255,255,0.08)'}`,
                background: open === i ? 'rgba(229,9,20,0.03)' : 'rgba(255,255,255,0.02)',
                transition: 'all 0.2s',
              }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  width: '100%', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '20px 24px',
                  background: 'transparent', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{
                  fontSize: '0.92rem', color: 'var(--warm-white)',
                  letterSpacing: '0.02em', fontWeight: open === i ? 600 : 400,
                }}>
                  {faq.frage}
                </span>
                <span style={{
                  color: open === i ? 'var(--red)' : 'var(--grey)',
                  fontSize: '1.1rem', flexShrink: 0, marginLeft: '16px',
                  transition: 'transform 0.2s',
                  transform: open === i ? 'rotate(45deg)' : 'rotate(0deg)',
                  display: 'inline-block',
                }}>
                  +
                </span>
              </button>

              {open === i && (
                <div style={{ padding: '0 24px 20px' }}>
                  <p style={{
                    fontSize: '0.88rem', color: 'var(--grey-light)',
                    lineHeight: 1.8, margin: 0,
                  }}>
                    {faq.antwort}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{
          marginTop: '48px', padding: '28px 32px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.02)',
        }}>
          <div style={{
            fontSize: '0.68rem', letterSpacing: '0.15em',
            color: 'var(--grey)', marginBottom: '12px', textTransform: 'uppercase',
          }}>Noch Fragen?</div>
          <p style={{ fontSize: '0.88rem', color: 'var(--grey-light)', lineHeight: 1.8, margin: '0 0 16px 0' }}>
            Wir helfen gerne weiter.
          </p>
          <a href="mailto:office@uncuttv.at" style={{
            display: 'inline-block', padding: '12px 24px',
            background: 'var(--red)', color: 'white',
            fontSize: '0.82rem', fontWeight: 700,
            letterSpacing: '0.08em', textDecoration: 'none',
            textTransform: 'uppercase',
          }}>
            office@uncuttv.at
          </a>
        </div>

        <div style={{
          marginTop: '48px', paddingTop: '32px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', gap: '24px', flexWrap: 'wrap',
        }}>
          <Link href="/de/impressum" style={{ fontSize: '0.78rem', color: 'var(--grey)', textDecoration: 'none' }}>Impressum</Link>
          <Link href="/de/datenschutz" style={{ fontSize: '0.78rem', color: 'var(--grey)', textDecoration: 'none' }}>Datenschutz</Link>
          <Link href="/de/agb" style={{ fontSize: '0.78rem', color: 'var(--grey)', textDecoration: 'none' }}>AGB</Link>
        </div>

      </div>
    </div>
  )
}

import { getTranslations } from 'next-intl/server'

/**
 * App-Links zwischen Filmemacher- und Tarifabschnitt.
 *
 * Serverkomponente wie FilmmakersSection: kein Zustand, kein Breakpoint in
 * JavaScript. Dass die Schaltflaechen auf schmalen Schirmen untereinander
 * stehen, regelt .apps-buttons in globals.css -- so geht fuer diesen Abschnitt
 * kein Javascript an den Browser.
 *
 * Vorerst mit Textschaltflaechen. Google und Amazon geben fuer ihre Badges
 * feste Vorgaben, die man weder nachbauen noch abwandeln darf; sobald die
 * Bilddateien vorliegen, treten sie an die Stelle der Beschriftungen.
 */

const STORES = [
  { key: 'googlePlay', href: 'https://play.google.com/store/apps/details?id=at.uncuttv.app' },
  { key: 'fireTv', href: 'https://www.amazon.de/UncutTV-GmbH/dp/B0DSK736VN' },
] as const

export default async function AppsSection() {
  const t = await getTranslations('apps')

  return (
    /* Polsterung in globals.css statt hier: sie muss oben denselben Sprung bei
       768 px machen wie PricingSection, damit beide Raender des Abschnitts an
       jeder Fensterbreite gleich breit sind. Inline ginge das nur mit einem
       Breakpoint in Javascript. */
    <section className="apps-section">
      <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            // Eine Stufe unter der Filmemacher-Ueberschrift: der Abschnitt ist
            // ein kurzer Hinweis zwischen zwei groesseren, kein eigenes Kapitel.
            fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
            lineHeight: 1.05,
            letterSpacing: '0.04em',
            color: 'var(--warm-white)',
            marginBottom: 'clamp(12px, 1.5vw, 18px)',
          }}
        >
          {t('title')}
        </h2>

        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: 'clamp(0.98rem, 1.4vw, 1.15rem)',
            lineHeight: 1.7,
            letterSpacing: '0.02em',
            color: 'var(--grey-light)',
            marginBottom: 'clamp(28px, 3.5vw, 40px)',
          }}
        >
          {t('text')}
        </p>

        <div className="apps-buttons">
          {STORES.map((store) => (
            <a
              key={store.key}
              className="btn-store"
              href={store.href}
              target="_blank"
              rel="noopener"
            >
              {t(store.key)}
            </a>
          ))}
        </div>

        <p
          style={{
            marginTop: 'clamp(20px, 2.5vw, 28px)',
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: '0.82rem',
            letterSpacing: '0.04em',
            color: 'var(--grey)',
          }}
        >
          {t('soon')}
        </p>
      </div>
    </section>
  )
}

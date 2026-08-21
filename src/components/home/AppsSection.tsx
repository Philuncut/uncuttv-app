import { getLocale, getTranslations } from 'next-intl/server'

/**
 * App-Links zwischen Filmemacher- und Tarifabschnitt.
 *
 * Serverkomponente wie FilmmakersSection: kein Zustand, kein Breakpoint in
 * JavaScript. Dass die Schaltflaechen auf schmalen Schirmen untereinander
 * stehen, regelt .apps-buttons in globals.css -- so geht fuer diesen Abschnitt
 * kein Javascript an den Browser.
 *
 * === Die Badges ===
 * Google und Amazon geben fuer ihre Badges feste Vorgaben: nicht verzerren,
 * nicht einfaerben, nicht beschneiden. Beide werden deshalb unveraendert
 * ausgeliefert, auf gleicher Hoehe und mit width: auto -- die Breite ergibt
 * sich aus dem Seitenverhaeltnis, gestreckt wird nichts. Die Originale liegen
 * unter assets/store-badges-original/; in public/badges/ steht dieselbe
 * Grafik, nur ohne den mitgelieferten Leerrand. Der Schutzabstand kommt
 * stattdessen aus der Polsterung von .badge-link.
 *
 * Der Fire-TV-Schriftzug ist die dunkle Fassung fuer helle Hintergruende --
 * auf dem Schwarz der Seite waeren "amazon" und "TV" nicht zu lesen. Beide
 * Badges stehen deshalb auf einer hellen Flaeche, und zwar auf derselben,
 * damit keiner der beiden Anbieter anders gewichtet wirkt. Kaeme von Amazon
 * die weisse Fassung, koennten beide direkt auf Schwarz stehen.
 *
 * === Sprache ===
 * badge nennt die Datei je Sprache. Vom Google-Badge liegt bisher nur die
 * englische Fassung vor, deutsch bekommt sie deshalb ebenfalls -- sobald
 * "JETZT BEI Google Play" da ist, ist es eine Zeile. Der Fire-TV-Schriftzug
 * traegt keinen Text und gilt fuer beide Sprachen.
 */

type Locale = 'de' | 'en'

interface Store {
  key: 'googlePlay' | 'fireTv'
  href: string
  /** Dateiname in public/badges/ je Sprache. */
  badge: Record<Locale, string>
  /** Groesse der Datei, damit vor dem Laden kein Platz nachrutscht. */
  width: number
  height: number
}

const STORES: Store[] = [
  {
    key: 'googlePlay',
    href: 'https://play.google.com/store/apps/details?id=at.uncuttv.app',
    // TODO: de auf 'googleplay-de.png' umstellen, sobald die deutsche Fassung da ist
    badge: { de: 'googleplay-en.png', en: 'googleplay-en.png' },
    width: 811,
    height: 241,
  },
  {
    key: 'fireTv',
    href: 'https://www.amazon.de/UncutTV-GmbH/dp/B0DSK736VN',
    badge: { de: 'firetv.png', en: 'firetv.png' },
    width: 576,
    height: 122,
  },
]

export default async function AppsSection() {
  const t = await getTranslations('apps')
  const locale = ((await getLocale()) === 'en' ? 'en' : 'de') satisfies Locale

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
              className="badge-link"
              href={store.href}
              target="_blank"
              rel="noopener"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/badges/${store.badge[locale]}`}
                // Der Handlungsaufruf des Badges, nicht seine Gattung: wer sich
                // die Seite vorlesen laesst, hoert, wohin der Link fuehrt.
                alt={t(`${store.key}Alt`)}
                width={store.width}
                height={store.height}
                loading="lazy"
                decoding="async"
                draggable={false}
              />
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

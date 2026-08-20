import { getTranslations } from 'next-intl/server'

/**
 * Ruhiger Abschnitt zwischen Manifest und Tarif: wohin das Abogeld geht.
 *
 * Bewusst ohne Schaltflaeche. Der Tarifabschnitt kommt unmittelbar danach und
 * traegt den Verkauf -- haette dieser hier auch einen Knopf, konkurrierten
 * zwei Aufforderungen um dieselbe Bewegung nach unten.
 *
 * Serverkomponente, anders als die uebrigen Abschnitte der Startseite: hier
 * gibt es keinen Zustand und keinen Breakpoint in JavaScript, die Groessen
 * regelt clamp(). So geht fuer diesen Abschnitt kein Javascript an den
 * Browser.
 *
 * Kein Prozentsatz, hier so wenig wie sonst irgendwo auf der Seite: eine Zahl
 * waere eine Zusage, die sich mit jeder Abrechnungsperiode aendern kann.
 */
export default async function FilmmakersSection() {
  const t = await getTranslations('filmmakers')

  return (
    <section
      style={{
        // Deutlich mehr Luft als in der USP-Sektion (dort 100px), und auf dem
        // schwarzen Grund statt auf --anthrazit wie das Manifest darueber:
        // der Wechsel trennt die beiden ruhigen Abschnitte voneinander.
        padding: 'clamp(88px, 14vw, 176px) 24px',
        background: 'var(--black)',
      }}
    >
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        <div
          style={{
            width: '40px',
            height: '1px',
            background: 'var(--red)',
            marginBottom: 'clamp(28px, 4vw, 44px)',
          }}
        />

        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
            lineHeight: 1.05,
            letterSpacing: '0.04em',
            color: 'var(--warm-white)',
            marginBottom: 'clamp(24px, 3vw, 36px)',
          }}
        >
          {t('title')}
        </h2>

        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: 'clamp(1.02rem, 1.6vw, 1.3rem)',
            // Weiter als die 1,8 der USP-Sektion: der Absatz steht allein auf
            // der Flaeche und darf atmen.
            lineHeight: 1.9,
            letterSpacing: '0.02em',
            color: 'var(--grey-light)',
          }}
        >
          {t('text')}
        </p>
      </div>
    </section>
  )
}

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'UncutTV – Coming Soon',
  robots: { index: false, follow: false },
}

export default function MaintenancePage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0a0a0a] px-6 py-16 text-[#f0ece4]">
      <div className="flex w-full max-w-lg flex-col items-center text-center">
        <img
          src="/icon.svg"
          width={96}
          height={96}
          alt="UncutTV"
          className="mb-10 h-20 w-20 shrink-0 md:h-24 md:w-24"
          decoding="async"
        />

        <h1
          className="text-[clamp(2.75rem,12vw,5rem)] leading-none tracking-[0.12em] text-white"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          COMING SOON
        </h1>

        <p
          className="mt-8 max-w-md text-base leading-relaxed text-[#bbb] md:text-lg"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Wir bauen gerade etwas Besonderes für dich.
        </p>
        <p
          className="mt-3 max-w-md text-sm leading-relaxed text-[#888] md:text-base"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          We&apos;re building something special. Stay tuned.
        </p>
      </div>

      <footer
        className="mt-auto flex flex-col items-center gap-2 pt-16 text-xs text-[#666] md:flex-row md:gap-3 md:text-sm"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        <span>© UncutTV GmbH</span>
        <span className="hidden md:inline" aria-hidden>
          ·
        </span>
        <a
          href="https://uncuttv.at"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#888] underline decoration-[#444] underline-offset-4 transition-colors hover:text-[#f0ece4] hover:decoration-[#888]"
        >
          uncuttv.at
        </a>
      </footer>
    </main>
  )
}

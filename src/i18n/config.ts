export const locales = ['de', 'en'] as const;
export const defaultLocale = 'de' as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  de: 'DE',
  en: 'EN',
};

export const routing = {
  locales: ['de', 'en'] as const,
  defaultLocale: 'de'
} as const;

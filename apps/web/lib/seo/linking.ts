// linking.ts - SEO link generation utilities
export interface LinkOptions {
  url: string;
  locale?: string; // e.g., 'en', 'es'
  defaultLocale?: string;
}
/**
 * Generates a canonical <link rel="canonical"> tag string.
 */
export function canonicalLink({ url }: LinkOptions): string {
  return `<link rel="canonical" href="${url}" />`;
}
/**
 * Generates an alternate <link rel="alternate" hreflang="..."> tag.
 * If locale is omitted, defaults to the provided defaultLocale.
 */
export function alternateLink({ url, locale = 'en', defaultLocale = 'en' }: LinkOptions): string {
  const hreflang = locale === defaultLocale ? 'x-default' : locale;
  return `<link rel="alternate" hreflang="${hreflang}" href="${url}" />`;
}

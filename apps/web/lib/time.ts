// time.ts – lightweight date‑utility helpers used across the app

/**
 * Return a human‑readable relative time string, e.g. "5 minutes ago" or
 * "in 2 days". This implementation uses the built‑in Intl.RelativeTimeFormat
 * which works in modern browsers and Node.
 */
export function formatRelative(date: Date | string, locale: string = 'en'): string {
  const now = new Date();
  const target = typeof date === 'string' ? new Date(date) : date;
  const diffMs = target.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  // ✅ Use the correct union type instead of keyof
  const divisions: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [7, 'day'],
    [4, 'week'],
    [12, 'month'],
    [Number.MAX_SAFE_INTEGER, 'year'],
  ];

  let amount = diffSec;
  let unit: Intl.RelativeTimeFormatUnit = 'second';

  for (const [limit, u] of divisions) {
    if (Math.abs(amount) < limit) {
      unit = u;
      break;
    }
    amount = Math.round(amount / limit);
    unit = u;
  }

  return rtf.format(amount, unit);
}

/**
 * Return a Date representing the start of the day (midnight) in the local
 * timezone for the given input.
 */
export function startOfDay(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Determine whether two dates fall on the same calendar day.
 */
export function isSameDay(a: Date | string, b: Date | string): boolean {
  const da = startOfDay(a);
  const db = startOfDay(b);
  return da.getTime() === db.getTime();
}

/**
 * Simple ISO‑8601 formatter (without milliseconds) – useful for
 * generating stable keys.
 */
export function toISO(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('.')[0] + 'Z';
}

export default { formatRelative, startOfDay, isSameDay, toISO };

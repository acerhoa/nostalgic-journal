/* ---------- date model ---------- */
// Day index 0 = Jan 1, 2026.
export const BASE = new Date(2026, 0, 1);
export const DAY = 86400000;

export const midnight = (d: Date): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const idxOf = (d: Date): number =>
  Math.round((midnight(d).getTime() - BASE.getTime()) / DAY);

export const dateOf = (i: number): Date =>
  new Date(BASE.getFullYear(), BASE.getMonth(), BASE.getDate() + i);

export const keyOf = (i: number): string => {
  const d = dateOf(i);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

export const fmtLong = (d: Date): string =>
  d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

// Spread pairing: the left page is always the even-parity day of a pair.
export const leftOfDay = (i: number): number => i - (((i % 2) + 2) % 2);

export const TODAY = idxOf(new Date());

// Escape user text before injecting it into the static flip-leaf markup.
export const esc = (s: string): string =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

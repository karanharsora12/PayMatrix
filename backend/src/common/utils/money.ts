/**
 * Money helpers — always use string/numeric(18,2) via Drizzle. Never float.
 */
export function toCents(v: string | number): number {
  return Math.round(Number(v) * 100);
}
export function fromCents(c: number): string {
  return (c / 100).toFixed(2);
}
export function add(a: string, b: string): string {
  return (Number(a) + Number(b)).toFixed(2);
}
export function percentOf(base: string | number, pct: string | number): string {
  return ((Number(base) * Number(pct)) / 100).toFixed(2);
}

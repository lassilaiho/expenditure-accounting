export async function ensureOk(r: Response) {
  if (!r.ok) {
    throw new Error(`${r.status} ${r.statusText}: ${await r.text()}`);
  }
}

export function formatDate(d: Date) {
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

export function formatMonth(d: Date) {
  return `${d.getMonth() + 1}/${d.getFullYear()}`;
}

export const threeDecimals = new Intl.NumberFormat('fi-FI', {
  style: 'decimal',
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

export const currency = new Intl.NumberFormat('fi-FI', {
  style: 'currency',
  currency: 'EUR',
});

export function reverse<A, B>(f: (a: A, b: B) => number): (a: A, b: B) => number {
  return (a, b) => -f(a, b);
}

export class DateRange {
  public constructor(
    public readonly from: Date,
    public readonly to: Date,
  ) { }

  public isIn(x: Date) {
    return this.from <= x && x <= this.to;
  }
}

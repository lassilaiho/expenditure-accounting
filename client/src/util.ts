import Big from 'big.js';
import moment from 'moment';

export async function ensureOk(r: Response) {
  if (!r.ok) {
    throw new Error(`${r.status} ${r.statusText}: ${await r.text()}`);
  }
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

export class DateRange {
  public constructor(
    public readonly from: moment.Moment,
    public readonly to: moment.Moment,
  ) {}

  public isIn(x: moment.Moment) {
    return x.isBetween(this.from, this.to, undefined, '[]');
  }
}

export function numOfBig(x: Big) {
  return parseFloat(x.valueOf());
}

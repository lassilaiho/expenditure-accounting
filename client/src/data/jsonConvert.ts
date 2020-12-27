import Big from 'big.js';
import moment from 'moment';

export function toNumber(x: any): number {
  if (typeof x === 'number') {
    return x;
  }
  throw new Error('Invalid number ' + x);
}

export function toString(x: any): string {
  if (typeof x === 'string') {
    return x;
  }
  throw new Error('Invalid string ' + x);
}

export function toBig(x: any): Big {
  return new Big(x);
}

export function toObject(x: any): any {
  if (typeof x === 'object') {
    return x;
  }
  throw new Error('Expected json object ' + x);
}

export function toArray<T>(conv: (x: any) => T, arr: any): T[] {
  if (Array.isArray(arr)) {
    return arr.map(conv);
  }
  throw new Error('Expected json array ' + arr);
}

export function toMomentUtc(x: any): moment.Moment {
  const m = moment.utc(x, moment.ISO_8601);
  if (m.isValid()) {
    return m;
  }
  throw new Error('Expected date ' + x);
}

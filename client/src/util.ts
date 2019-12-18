export async function ensureOk(r: Response) {
  if (!r.ok) {
    throw new Error(`${r.status} ${r.statusText}: ${await r.text()}`);
  }
}

export function formatDate(d: Date) {
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
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

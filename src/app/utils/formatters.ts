const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const NUMBER_FORMATTER = new Intl.NumberFormat('en-US');
const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'medium',
});
export function formatCents(value: number | 'unknown' | undefined): string {
  return value === undefined || value === 'unknown'
    ? 'N/A'
    : formatPrice(value / 100);
}

export function formatDate(value: Date | string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : DATE_FORMATTER.format(date);
}

export function formatPercent(value: number | 'unknown' | undefined): string {
  return value === undefined || value === 'unknown'
    ? 'N/A'
    : `${value > 0 ? '+' : ''}${value.toFixed(2)}`;
}

export function formatPrice(value: number | undefined): string {
  return value === undefined ? 'N/A' : USD_FORMATTER.format(value);
}

export function formatVolume(value: number | undefined): string {
  return value === undefined
    ? '0 units'
    : `${NUMBER_FORMATTER.format(value)} units`;
}

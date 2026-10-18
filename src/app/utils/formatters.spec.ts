import { describe, expect, it } from 'vitest';
import {
  formatCents,
  formatDate,
  formatPercent,
  formatPrice,
  formatVolume,
} from './formatters';

describe('market formatters', () => {
  it('formats cents as USD prices and preserves unknown values', () => {
    expect(formatCents(10_150)).toBe('$101.50');
    expect(formatCents('unknown')).toBe('N/A');
    expect(formatCents(undefined)).toBe('N/A');
  });

  it('formats dates and reports invalid or missing dates as N/A', () => {
    expect(formatDate('not a date')).toBe('N/A');
    expect(formatDate(undefined)).toBe('N/A');
    expect(formatDate(new Date('2026-01-01T00:00:00.000Z'))).not.toBe('N/A');
  });

  it('formats imbalance values with a sign and fixed precision', () => {
    expect(formatPercent(0.2)).toBe('+0.20');
    expect(formatPercent(-0.15)).toBe('-0.15');
    expect(formatPercent('unknown')).toBe('N/A');
  });

  it('formats dollar prices and trade volume', () => {
    expect(formatPrice(101.5)).toBe('$101.50');
    expect(formatPrice(undefined)).toBe('N/A');
    expect(formatVolume(1_240)).toBe('1,240 units');
    expect(formatVolume(undefined)).toBe('0 units');
  });
});

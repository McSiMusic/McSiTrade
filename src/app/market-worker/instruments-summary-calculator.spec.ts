import { beforeEach, describe, expect, it } from 'vitest';
import { InstrumentsSummaryCalculator } from './instruments-summary-calculator';
import type { GeneratedUpdate } from '../../types';

describe('InstrumentsSummaryCalculator', () => {
  let calculator: InstrumentsSummaryCalculator;
  const update: GeneratedUpdate = {
    instrument: 'ALFA',
    priceCents: 10500,
    bidCents: 10400,
    askCents: 10650,
    tradeQuantity: 4,
    bidQuantity: 30,
    askQuantity: 10,
  };

  beforeEach(() => {
    calculator = new InstrumentsSummaryCalculator();
  });

  it('calculates summaries and retains accumulated volume between batches', () => {
    expect(calculator.calculate([update])).toEqual({
      ALFA: {
        lastPriceCents: 10500,
        bidAskSpreadCents: 250,
        tradingVolume: 4,
        vwapCents: 10500,
        orderBookImbalance: 0.5,
      },
    });

    const latestUpdate = {
      ...update,
      priceCents: 11000,
      tradeQuantity: 6,
      bidQuantity: 10,
      askQuantity: 30,
    };

    expect(calculator.calculate([latestUpdate])).toEqual({
      ALFA: {
        lastPriceCents: 11000,
        bidAskSpreadCents: 250,
        tradingVolume: 10,
        vwapCents: 10800,
        orderBookImbalance: -0.5,
      },
    });
  });

  it('accumulates every update and keeps each instrument last update in a single batch', () => {
    const betaUpdate = { ...update, instrument: 'BETA', tradeQuantity: 2 };
    const latestAlphaUpdate = {
      ...update,
      priceCents: 12000,
      tradeQuantity: 3,
    };

    expect(
      calculator.calculate([update, betaUpdate, latestAlphaUpdate]),
    ).toEqual({
      ALFA: {
        lastPriceCents: 12000,
        bidAskSpreadCents: 250,
        tradingVolume: 7,
        vwapCents: 11142.857142857143,
        orderBookImbalance: 0.5,
      },
      BETA: {
        lastPriceCents: 10500,
        bidAskSpreadCents: 250,
        tradingVolume: 2,
        vwapCents: 10500,
        orderBookImbalance: 0.5,
      },
    });
  });

  it('calculates VWAP, spread, and imbalance for the required cents example', () => {
    const firstTrade: GeneratedUpdate = {
      instrument: 'ALFA',
      priceCents: 10000,
      bidCents: 9990,
      askCents: 10010,
      tradeQuantity: 10,
      bidQuantity: 500,
      askQuantity: 500,
    };
    const secondTrade: GeneratedUpdate = {
      instrument: 'ALFA',
      priceCents: 10200,
      bidCents: 10196,
      askCents: 10200,
      tradeQuantity: 30,
      bidQuantity: 600,
      askQuantity: 400,
    };

    expect(calculator.calculate([firstTrade, secondTrade])).toEqual({
      ALFA: {
        lastPriceCents: 10200,
        bidAskSpreadCents: 4,
        tradingVolume: 40,
        vwapCents: 10150,
        orderBookImbalance: 0.2,
      },
    });
  });

  it('returns unknown when VWAP or order book imbalance has a zero denominator', () => {
    expect(
      calculator.calculate([
        { ...update, tradeQuantity: 0, bidQuantity: 0, askQuantity: 0 },
      ]),
    ).toEqual({
      ALFA: {
        lastPriceCents: 10500,
        bidAskSpreadCents: 250,
        tradingVolume: 0,
        vwapCents: 'unknown',
        orderBookImbalance: 'unknown',
      },
    });
  });

  it('clears accumulated values when reset is called', () => {
    calculator.calculate([update]);
    calculator.reset();

    expect(calculator.calculate([update])).toEqual({
      ALFA: {
        lastPriceCents: 10500,
        bidAskSpreadCents: 250,
        tradingVolume: 4,
        vwapCents: 10500,
        orderBookImbalance: 0.5,
      },
    });
  });
});

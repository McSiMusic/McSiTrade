import type { GeneratedUpdate } from '../../types';
import type { InstrumentAccumulator, InstrumentSummary } from './types';

export class InstrumentsSummaryCalculator {
  private readonly accumulators = new Map<string, InstrumentAccumulator>();
  private readonly latestSummaries = new Map<string, InstrumentSummary>();

  calculate(
    generatedUpdates: GeneratedUpdate[],
  ): ReadonlyMap<string, InstrumentSummary> {
    for (const update of generatedUpdates) {
      let accumulator = this.accumulators.get(update.instrument);
      if (accumulator === undefined) {
        accumulator = { totalVolume: 0, totalVolumePrice: 0 };
        this.accumulators.set(update.instrument, accumulator);
      }

      accumulator.totalVolume += update.tradeQuantity;
      accumulator.totalVolumePrice += update.priceCents * update.tradeQuantity;

      const orderBookQuantity = update.bidQuantity + update.askQuantity;
      this.latestSummaries.set(update.instrument, {
        lastPriceCents: update.priceCents,
        bidAskSpreadCents: update.askCents - update.bidCents,
        tradingVolume: accumulator.totalVolume,
        vwapCents:
          accumulator.totalVolume === 0
            ? 'unknown'
            : accumulator.totalVolumePrice / accumulator.totalVolume,
        orderBookImbalance:
          orderBookQuantity === 0
            ? 'unknown'
            : (update.bidQuantity - update.askQuantity) / orderBookQuantity,
      });
    }

    return this.latestSummaries;
  }

  reset(): void {
    this.accumulators.clear();
    this.latestSummaries.clear();
  }
}

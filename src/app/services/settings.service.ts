import { Injectable } from '@angular/core';
import {
  MAX_BATCH_INTERVAL_MS,
  MAX_INSTRUMENTS,
  MAX_UPDATES_PER_BATCH,
  MIN_BATCH_INTERVAL_MS,
  MIN_INSTRUMENTS,
  MIN_UPDATES_PER_BATCH,
} from '../pages/settings/consts';
import { MarketDataService } from './market-data.service';
import type { MarketSettings } from './market-data.service';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  constructor(private readonly marketData: MarketDataService) {}

  applySettings(settings: MarketSettings): boolean {
    if (
      !Number.isInteger(settings.instrumentCount) ||
      settings.instrumentCount < MIN_INSTRUMENTS ||
      settings.instrumentCount > MAX_INSTRUMENTS ||
      !Number.isInteger(settings.updatesPerBatch) ||
      settings.updatesPerBatch < MIN_UPDATES_PER_BATCH ||
      settings.updatesPerBatch > MAX_UPDATES_PER_BATCH ||
      !Number.isInteger(settings.batchIntervalMs) ||
      settings.batchIntervalMs < MIN_BATCH_INTERVAL_MS ||
      settings.batchIntervalMs > MAX_BATCH_INTERVAL_MS
    ) {
      return false;
    }

    this.marketData.applySettings(settings);
    return true;
  }
}

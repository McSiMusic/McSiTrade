import { DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  MAX_BATCH_INTERVAL_MS,
  MAX_INSTRUMENTS,
  MAX_UPDATES_PER_BATCH,
  MIN_BATCH_INTERVAL_MS,
  MIN_INSTRUMENTS,
  MIN_UPDATES_PER_BATCH,
} from './consts';
import { MarketDataService } from '../../services/market-data.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  imports: [DecimalPipe, FormsModule],
  selector: 'app-settings',
  styleUrl: './settings.scss',
  templateUrl: './settings.html',
})
export class Settings {
  protected readonly marketService = inject(MarketDataService);
  protected readonly limits = {
    minInstruments: MIN_INSTRUMENTS,
    maxInstruments: MAX_INSTRUMENTS,
    minUpdates: MIN_UPDATES_PER_BATCH,
    maxUpdates: MAX_UPDATES_PER_BATCH,
    minInterval: MIN_BATCH_INTERVAL_MS,
    maxInterval: MAX_BATCH_INTERVAL_MS,
  };

  private readonly settingsService = inject(SettingsService);
  private readonly router = inject(Router);
  protected instrumentCount = this.marketService.settings().instrumentCount;
  protected updatesPerBatch = this.marketService.settings().updatesPerBatch;
  protected batchIntervalMs = this.marketService.settings().batchIntervalMs;

  protected applySettings(): void {
    const applied = this.settingsService.applySettings({
      instrumentCount: Number(this.instrumentCount),
      updatesPerBatch: Number(this.updatesPerBatch),
      batchIntervalMs: Number(this.batchIntervalMs),
    });
    if (applied) {
      void this.router.navigateByUrl('/');
    }
  }
}

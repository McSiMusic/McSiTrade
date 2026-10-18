import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { MarketDataService } from './market-data.service';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  it('validates settings before starting a new run', () => {
    const applySettings = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        SettingsService,
        { provide: MarketDataService, useValue: { applySettings } },
      ],
    });
    const service = TestBed.inject(SettingsService);

    expect(
      service.applySettings({
        instrumentCount: 5,
        updatesPerBatch: 1000,
        batchIntervalMs: 500,
      }),
    ).toBe(true);
    expect(applySettings).toHaveBeenCalledWith({
      instrumentCount: 5,
      updatesPerBatch: 1000,
      batchIntervalMs: 500,
    });

    expect(
      service.applySettings({
        instrumentCount: 51,
        updatesPerBatch: 100,
        batchIntervalMs: 500,
      }),
    ).toBe(false);
    expect(applySettings).toHaveBeenCalledOnce();

    expect(
      service.applySettings({
        instrumentCount: 5,
        updatesPerBatch: 1001,
        batchIntervalMs: 500,
      }),
    ).toBe(false);
    expect(applySettings).toHaveBeenCalledOnce();
  });
});

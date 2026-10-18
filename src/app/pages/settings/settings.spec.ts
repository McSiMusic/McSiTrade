import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DEFAULT_MARKET_SETTINGS } from './consts';
import { Settings } from './settings';
import { MarketDataService } from '../../services/market-data.service';
import { SettingsService } from '../../services/settings.service';
import { vi } from 'vitest';

describe('Settings', () => {
  let component: Settings;
  let fixture: ComponentFixture<Settings>;
  let applySettingsSpy: ReturnType<typeof vi.fn>;
  let navigateByUrlSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    applySettingsSpy = vi.fn(() => true);
    navigateByUrlSpy = vi.fn();
    await TestBed.configureTestingModule({
      imports: [Settings],
      providers: [
        {
          provide: MarketDataService,
          useValue: {
            isRunning: () => true,
            errorMessage: () => null,
            summaries: () => new Map(),
            instruments: () => ['AAPL'],
            settings: () => DEFAULT_MARKET_SETTINGS,
            hasStarted: () => true,
            toggleRun: () => {},
            applySettings: () => {},
          },
        },
        {
          provide: SettingsService,
          useValue: { applySettings: applySettingsSpy },
        },
        {
          provide: Router,
          useValue: { navigateByUrl: navigateByUrlSpy },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Settings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('navigates to the dashboard after settings are applied', () => {
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));

    expect(applySettingsSpy).toHaveBeenCalledWith(DEFAULT_MARKET_SETTINGS);
    expect(navigateByUrlSpy).toHaveBeenCalledWith('/');
  });

  it('disables applying settings when an input exceeds the WASM constraints', () => {
    const instrumentCount = fixture.nativeElement.querySelector(
      'input[name="instrumentCount"]',
    ) as HTMLInputElement;
    instrumentCount.value = '51';
    instrumentCount.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const applyButton = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    expect(applyButton.disabled).toBe(true);
  });

  it('limits updates per batch to 1,000', () => {
    const updatesPerBatch = fixture.nativeElement.querySelector(
      'input[name="updatesPerBatch"]',
    ) as HTMLInputElement;

    expect(updatesPerBatch.max).toBe('1000');
  });
});

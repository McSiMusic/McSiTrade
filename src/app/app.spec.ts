import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { vi } from 'vitest';
import { App } from './app';
import { routes } from './app.routes';
import { Dashboard } from './pages/dashboard/dashboard';
import { Settings } from './pages/settings/settings';
import { MarketDataService } from './services/market-data.service';

describe('App', () => {
  const marketDataMock = {
    isRunning: () => true,
    errorMessage: () => null,
    summaries: () => new Map(),
    instruments: () => ['AAPL'],
    settings: () => ({ instrumentCount: 1, updatesPerBatch: 100, batchIntervalMs: 500 }),
    hasStarted: () => true,
    start: vi.fn(),
    toggleRun: () => {},
    applySettings: () => {},
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        {
          provide: MarketDataService,
          useValue: marketDataMock,
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
    expect(marketDataMock.start).toHaveBeenCalled();
  });

  it('should show the dashboard at the home page', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/', Dashboard);

    expect(harness.routeNativeElement?.textContent).toContain('Instrument monitor');
  });

  it('should show the settings page at /settings', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/settings', Settings);

    expect(harness.routeNativeElement?.textContent).toContain(
      'Configure the next market run',
    );
  });
});

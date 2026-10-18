import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dashboard } from './dashboard';
import { MarketDataService } from '../../services/market-data.service';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        {
          provide: MarketDataService,
          useValue: {
            isRunning: () => true,
            errorMessage: () => null,
            summaries: () => new Map(),
            instruments: () => [],
            settings: () => ({ instrumentCount: 1, updatesPerBatch: 100, batchIntervalMs: 500 }),
            hasStarted: () => true,
            toggleRun: () => {},
            applySettings: () => {},
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows a loader while waiting for the first market update', () => {
    const loadingStatus = fixture.nativeElement.querySelector(
      '[role="status"]',
    ) as HTMLElement | null;

    expect(loadingStatus?.textContent).toContain('Loading market data...');
  });
});

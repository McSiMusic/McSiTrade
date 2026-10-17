import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { App } from './app';
import { routes } from './app.routes';
import { Dashboard } from './pages/dashboard/dashboard';
import { Settings } from './pages/settings/settings';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should show the dashboard at the home page', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/', Dashboard);

    expect(harness.routeNativeElement?.textContent).toContain('dashboard works!');
  });

  it('should show the settings page at /settings', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/settings', Settings);

    expect(harness.routeNativeElement?.textContent).toContain('settings works!');
  });
});

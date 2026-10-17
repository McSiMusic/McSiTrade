import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { Settings } from './pages/settings/settings';

export const routes: Routes = [
  { path: '', component: Dashboard, pathMatch: 'full' },
  { path: 'settings', component: Settings },
  { path: '**', redirectTo: '' },
];

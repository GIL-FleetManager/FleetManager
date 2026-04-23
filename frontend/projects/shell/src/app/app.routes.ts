import { Routes } from '@angular/router';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard').then(m => m.DashboardComponent),
  },
  {
    path: 'conducteurs',
    canActivate: [roleGuard],
    loadComponent: () =>
      import('./features/conducteurs/conducteurs').then(m => m.Conducteurs),
  },
  {
    path: 'vehicules',
    canActivate: [roleGuard],
    loadComponent: () =>
      import('./features/vehicules/vehicules').then(m => m.Vehicules),
  },
  {
    path: 'maintenance',
    canActivate: [roleGuard],
    loadComponent: () =>
      import('./features/maintenance/maintenance').then(m => m.Maintenance),
  },
];
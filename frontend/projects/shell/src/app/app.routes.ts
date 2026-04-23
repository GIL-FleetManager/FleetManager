import { Routes } from '@angular/router';

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
    loadComponent: () =>
      import('./features/conducteurs/conducteurs').then(m => m.Conducteurs),
  },
  {
    path: 'vehicules',
    loadComponent: () =>
      import('./features/vehicules/vehicules').then(m => m.Vehicules),
  },
  {
    path: 'maintenance',
    loadComponent: () =>
      import('./features/maintenance/maintenance').then(m => m.Maintenance),
  },
];
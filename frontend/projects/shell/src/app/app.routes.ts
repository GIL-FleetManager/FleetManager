import { Routes } from '@angular/router';
import { roleGuard } from './role.guard'; 

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
  },
  {
    path: 'conducteurs',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'manager'] },
    loadComponent: () => import('./features/conducteurs/conducteurs').then((m) => m.Conducteurs),
  },
  {
    path: 'vehicules',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'manager'] },
    loadComponent: () => import('./features/vehicules/vehicules').then((m) => m.Vehicules),
  },
  {
    path: 'maintenance',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'technicien', 'manager'] },
    loadComponent: () => import('./features/maintenance/maintenance').then((m) => m.Maintenance),
  },
  {
    path: 'map',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'manager'] },
    loadComponent: () => import('./features/map/map').then((m) => m.MapComponent),
  },
];

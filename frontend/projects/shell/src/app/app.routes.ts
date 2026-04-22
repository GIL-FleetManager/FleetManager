import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'conducteurs',
    // On pointe vers le fichier 'conducteurs' et la classe 'Conducteurs'
    loadComponent: () => import('./features/conducteurs/conducteurs').then(m => m.Conducteurs)
  },
  { path: '', redirectTo: 'conducteurs', pathMatch: 'full' }
];
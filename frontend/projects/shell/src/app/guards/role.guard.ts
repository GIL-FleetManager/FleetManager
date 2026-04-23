import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

/**
 * Protège les routes accessibles seulement aux admin/manager/technician.
 * Un conducteur est redirigé vers /dashboard.
 */
export const roleGuard: CanActivateFn = () => {
  const keycloak = inject(KeycloakService);
  const router   = inject(Router);

  const roles = keycloak.getUserRoles(true);
  const isRestricted = roles.includes('conducteur') &&
    !roles.includes('admin') && !roles.includes('manager') && !roles.includes('technician');

  if (isRestricted) {
    router.navigate(['/dashboard']);
    return false;
  }
  return true;
};

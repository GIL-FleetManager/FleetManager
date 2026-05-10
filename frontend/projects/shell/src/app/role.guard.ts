import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

export const roleGuard: CanActivateFn = async (route, state) => {
  const keycloak = inject(KeycloakService);
  const router = inject(Router);

  const isLoggedIn = await keycloak.isLoggedIn();
  if (!isLoggedIn) {
    await keycloak.login({ redirectUri: window.location.origin + state.url });
    return false;
  }

  const requiredRoles = route.data['roles'] as string[];
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  const tokenParsed = keycloak.getKeycloakInstance().tokenParsed;
  const realmRoles = tokenParsed?.realm_access?.roles ?? [];
  const clientRoles = tokenParsed?.resource_access?.['fleet-frontend']?.roles ?? [];
  const userRoles = [...realmRoles, ...clientRoles];

  const hasAccess = requiredRoles.some((role) => userRoles.includes(role));

  if (hasAccess) {
    return true;
  } else {
    console.warn(`🛑 Accès refusé. Requis: ${requiredRoles}. Possédés: ${userRoles}`);
    router.navigate(['/dashboard']);
    return false;
  }
};

import { KeycloakService } from 'keycloak-angular';
import { environment } from '../environements/environment';

export function initializeKeycloak(keycloak: KeycloakService) {
  return () =>
    keycloak.init({
      config: {
        url:      environment.keycloak.url,
        realm:    environment.keycloak.realm,
        clientId: environment.keycloak.client,
      },
      initOptions: {
        onLoad: 'login-required',
        checkLoginIframe: false,
        scope: 'openid profile email roles',
      },
      enableBearerInterceptor: true,
      bearerPrefix: 'Bearer',
    });
}

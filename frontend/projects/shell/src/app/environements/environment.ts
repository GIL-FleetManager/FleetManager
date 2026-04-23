export const environment = {
  production: false,

  // === API Gateway (point d'entrée unique) ===
  apiGatewayUrl: 'http://localhost:8080/api',

  // === URLs directes des microservices (dev uniquement) ===
  services: {
    vehicles:     'http://localhost:8081',
    drivers:      'http://localhost:8082',
    maintenance:  'http://localhost:8083',
    location:     'http://localhost:8084',
    events:       'http://localhost:8085',
  },

  // === Keycloak ===
  keycloak: {
    url:    'http://localhost:8080',
    realm:  'fleet-manager',
    client: 'fleet-frontend',
  },

  // === WebSocket / gRPC-Web pour la localisation ===
  wsUrl: 'ws://localhost:3004/location/stream',
};
export const environment = {
  production: false,

  // === Graphql API Gateway (Single entry point via K8s bridge) ===
  // start-app.sh script forwards 8081 -> 8080
  apiGatewayUrl: 'http://localhost:8081/api',

  // === Keycloak (Auth via K8s bridge) ===
  // start-app.sh script forwards 8080 -> 8080
  keycloak: {
    url: 'http://localhost:8080',
    realm: 'fleet-manager',
    client: 'fleet-frontend',
  },

  // === Services (Routes handled by the Gateway) ===
  services: {
    vehicles: 'http://localhost:8081/api/vehicles',
    drivers: 'http://localhost:8081/api/conducteurs',
    maintenance: 'http://localhost:8081/api/maintenance',
    location: 'http://localhost:8081/api/location',
    events: 'http://localhost:8081/api/events',
  },

  wsUrl: 'ws://localhost:8084/location/stream',
};

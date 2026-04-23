export const environment = {
  production: true,

  // En prod tout passe par l'API Gateway / Ingress K8s
  apiGatewayUrl: '/api',

  services: {
    vehicles:     '/api/vehicles',
    drivers:      '/api/conductors',
    maintenance:  '/api/maintenance',
    location:     '/api/location',
    events:       '/api/events',
  },

  keycloak: {
    url:    'https://auth.fleetmanager.com',
    realm:  'fleetmanager',
    client: 'fleet-frontend',
  },

  wsUrl: 'wss://fleetmanager.com/api/location/stream',
};
#!/bin/bash
echo "Starting FleetManager Demo Pipes..."
kubectl port-forward svc/api-gateway 8080:8080 -n fleet-manager &
kubectl port-forward svc/keycloak-service 8081:8080 -n fleet-manager &
echo "Apollo at http://localhost:8080"
echo "Keycloak at http://localhost:8081"
wait
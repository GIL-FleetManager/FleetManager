#!/bin/bash
echo "Opening bridges to FleetManager Application..."
kubectl port-forward svc/api-gateway 8081:8080 -n fleet-manager &
kubectl port-forward svc/keycloak-service 8080:8080 -n fleet-manager &

echo "------------------------------------------------"
echo "Apollo Explorer: http://localhost:8081"
echo "Keycloak Admin:   http://localhost:8080"
echo "------------------------------------------------"
echo "Press [Ctrl+C] to stop the app bridge."
wait·
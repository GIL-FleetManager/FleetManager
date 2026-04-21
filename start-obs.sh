#!/bin/bash
echo "Opening bridges to Observability Stack..."
kubectl port-forward svc/jaeger 16686:16686 -n observabilite &
kubectl port-forward svc/kube-prom-grafana 3000:80 -n observabilite &

echo "------------------------------------------------"
echo "Jaeger (Traces):  http://localhost:16686"
echo "Grafana (Metrics): http://localhost:3000"
echo "------------------------------------------------"
echo "Press [Ctrl+C] to stop the observability bridge."
wait
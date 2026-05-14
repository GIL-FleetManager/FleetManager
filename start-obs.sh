#!/bin/bash
echo "Opening bridges to Observability Stack..."
kubectl port-forward svc/jaeger 16686:16686 -n observabilite &
kubectl port-forward svc/kube-prom-grafana 3000:80 -n observabilite &
kubectl port-forward svc/loki-gateway 3100:80 -n observabilite &
kubectl port-forward svc/kube-prom-kube-prometheus-prometheus 9090:9090 -n observabilite &

echo "------------------------------------------------"
echo "Jaeger (Traces):    http://localhost:16686"
echo "Grafana (Metrics):  http://localhost:3000"
echo "Loki (Logs):        http://localhost:3100"
echo "Prometheus:         http://localhost:9090"
echo "------------------------------------------------"
echo "Press [Ctrl+C] to stop the observability bridge."
wait

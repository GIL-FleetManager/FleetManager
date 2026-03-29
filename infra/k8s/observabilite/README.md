@"
# Stack Observabilité — FleetManager

## Prérequis
- Docker Desktop avec Kubernetes activé
- Helm installé

## Installation

### 1. Ajouter les repos Helm
``````bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts
helm repo update
``````

### 2. Créer le namespace
``````bash
kubectl create namespace observabilite
``````

### 3. Installer la stack
``````bash
helm install kube-prom prometheus-community/kube-prometheus-stack -n observabilite
helm install loki grafana/loki -n observabilite --set deploymentMode=SingleBinary --set loki.auth_enabled=false --set singleBinary.replicas=1 --set minio.enabled=false --set loki.storage.type=filesystem --set read.replicas=0 --set write.replicas=0 --set backend.replicas=0 --set loki.useTestSchema=true
helm install jaeger jaegertracing/jaeger -n observabilite
helm install otel-collector open-telemetry/opentelemetry-collector -n observabilite
``````

### 4. Configurer les datasources Grafana
``````bash
kubectl apply -f k8s/observabilite/loki-datasource.yaml
kubectl rollout restart deployment kube-prom-grafana -n observabilite
``````

## Accès aux interfaces
- Grafana : kubectl port-forward -n observabilite svc/kube-prom-grafana 3000:80 → http://localhost:3000
- Jaeger  : kubectl port-forward -n observabilite svc/jaeger 16686:16686 → http://localhost:16686
"@ | Out-File -FilePath "k8s\observabilite\README.md" -Encoding utf8
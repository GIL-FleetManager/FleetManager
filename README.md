# Fleet Manager

Microservices platform for fleet management — vehicles, drivers, maintenance, and GPS tracking.

## Prerequisites

- Docker + Minikube
- kubectl
- Helm v3
- Node.js 18+

## Deployment

### 1. Start Minikube

```bash
minikube start --driver=docker
eval $(minikube docker-env)
```

### 2. Create namespaces

```bash
kubectl create namespace fleet-manager
kubectl create namespace database
kubectl create namespace observabilite
```

### 3. Build service images

```bash
docker build -t fleetmanager-api-gateway:latest services/api-gateway/
docker build -t fleetmanager-vehicle-service:latest services/vehicle-service/
docker build -t fleetmanager-conductor-service:latest services/conductor-service/
docker build -t fleetmanager-maintenance-service:latest services/maintenance-service/
docker build -t fleetmanager-localization-service:latest services/localization-service/
docker build -t fleetmanager-event-service:latest services/event-service/
```

### 4. Deploy databases

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add timescale https://charts.timescale.com

helm install fleet-db bitnami/postgresql -n database \
  --set auth.postgresPassword=${DB_PASSWORD} \
  --set primary.persistence.enabled=false

helm install fleet-localization-db timescale/timescaledb-single -n database \
  --set secrets.credentials.PATRONI_SUPERUSER_PASSWORD=${DB_PASSWORD} \
  --set secrets.credentials.PATRONI_REPLICATION_PASSWORD=${DB_PASSWORD} \
  --set secrets.credentials.PATRONI_PASSWORD=${DB_PASSWORD} \
  --set persistentVolumes.data.enabled=false \
  --set persistentVolumes.wal.enabled=false
```

### 5. Deploy Keycloak

```bash
kubectl apply -f kubernetes/services/ -n fleet-manager
kubectl create configmap keycloak-realm-import \
  -n fleet-manager \
  --from-file=realm.json=docs/keycloak-config.json
```

### 6. Deploy services

```bash
kubectl create configmap global-fleet-config --from-env-file=.env -n fleet-manager
kubectl apply -f kubernetes/services/ -n fleet-manager
```

### 7. Run migrations

```bash
kubectl exec -it deploy/vehicle-service -n fleet-manager -- \
  php bin/console doctrine:migrations:migrate --no-interaction

kubectl exec -it deploy/conductor-service -n fleet-manager -- \
  php bin/console doctrine:migrations:migrate --no-interaction

kubectl exec -it deploy/maintenance-service -n fleet-manager -- \
  php bin/console doctrine:migrations:migrate --no-interaction
```

kubectl exec -it deploy/vehicle-service -n fleet-manager -- php bin/console doctrine:schema:drop --force --full-database

kubectl exec -it deploy/conductor-service -n fleet-manager -- php bin/console doctrine:schema:drop --force --full-database

kubectl exec -it deploy/maintenance-service -n fleet-manager -- php bin/console doctrine:schema:drop --force --full-database

---

## Observability

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts

helm install kube-prom prometheus-community/kube-prometheus-stack -n observabilite

helm install loki grafana/loki -n observabilite \
  --set deploymentMode=SingleBinary \
  --set loki.auth_enabled=false \
  --set singleBinary.replicas=1 \
  --set minio.enabled=false \
  --set loki.storage.type=filesystem \
  --set read.replicas=0 --set write.replicas=0 --set backend.replicas=0 \
  --set loki.useTestSchema=true \
  --set loki.commonConfig.replication_factor=1

helm install promtail grafana/promtail -n observabilite \
  --set config.clients[0].url=http://loki-gateway.observabilite.svc.cluster.local/loki/api/v1/push

helm install jaeger jaegertracing/jaeger -n observabilite

helm install otel-collector open-telemetry/opentelemetry-collector -n observabilite \
  --set image.repository="otel/opentelemetry-collector-contrib" \
  --set mode="deployment"
```

---

## Access

Start port-forwards:

```bash
./start-app.sh      # API Gateway + Keycloak
./start-obs.sh      # Grafana + Prometheus + Jaeger + Loki
```

| Service                 | URL                    |
| ----------------------- | ---------------------- |
| Apollo GraphQL Explorer | http://localhost:8081  |
| Keycloak Admin          | http://localhost:8080  |
| Grafana                 | http://localhost:3000  |
| Prometheus              | http://localhost:9090  |
| Jaeger                  | http://localhost:16686 |
| Loki Gateway            | http://localhost:3100  |

Grafana default credentials: `admin` / retrieved via:

```bash
kubectl get secret kube-prom-grafana -n observabilite \
  -o jsonpath="{.data.admin-password}" | base64 -d
```

---

## Kafka Topics

| Topic                | Producer             | Description                 |
| -------------------- | -------------------- | --------------------------- |
| `driver.assigned`    | Conductor Service    | Driver assigned to vehicle  |
| `vehicle.updated`    | Vehicle Service      | Vehicle status changed      |
| `maintenance.alert`  | Maintenance Service  | Maintenance alert triggered |
| `fleet.location.raw` | Localization Service | Raw GPS data                |
| `fleet.system.logs`  | All services         | System logs                 |

---

## Environment Variables

```bash
DB_USER=postgres
DB_PASSWORD=sidou_password
DB_NAME=fleetmanager
APP_SECRET=your-secret-key
APP_ENV=prod
KAFKA_BROKERS=fleet-kafka-kafka-bootstrap.fleet-manager.svc.cluster.local:9092
VEHICLE_SERVICE_URL=http://vehicle-service:80
CONDUCTOR_SERVICE_URL=http://conductor-service:80
MAINTENANCE_SERVICE_URL=http://maintenance-service:80
LOCALIZATION_SERVICE_URL=http://localization-service:8000
KEYCLOAK_URL=http://fleet-keycloak:8080
```

---

## Authentication

Obtain a token:

```bash
curl -X POST 'http://localhost:8080/realms/fleet-manager/protocol/openid-connect/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=password&client_id=fleet-frontend&username=USER&password=PASS&scope=openid'
```

Pass the token in GraphQL requests:

```
Authorization: Bearer <access_token>
```

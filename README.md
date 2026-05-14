# Fleet Manager

Complete setup guide for deploying the Fleet Manager application with microservices, Kafka events, and Kubernetes orchestration.

## Prerequisites

### Local Development (Docker Compose)

- **Docker** & **Docker Compose** (v2.0+)
- **Make** (for convenient commands)
- `.env` file configured with database credentials

### Kubernetes Deployment

- **Minikube** or **Kubernetes** cluster (v1.20+)
- **kubectl** configured to access your cluster
- **Helm** (v3.0+)
- **Strimzi Kafka Operator** (for Kafka on K8s)

## Quick Start - Local Development

### 1. Environment Setup

Create a `.env` file in the project root:

```bash
cp .env.example .env 
# or create manually:
cat > .env << 'EOF'
DB_USER=postgres
DB_PASSWORD=fleetmanager
DB_NAME=fleetmanager
APP_SECRET=your-secret-key-here
DEFAULT_URI=http://localhost
EOF
```


### Kubernetes Deployment

#### 1. Create Namespace

```bash
kubectl create namespace fleet-manager
```

#### 2. Install PostgreSQL (with Helm)

```bash
# Add Bitnami Helm repository
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Install PostgreSQL for shared databases
helm install fleet-db bitnami/postgresql -n database \
  --set auth.postgresPassword=${DB_PASSWORD} \
  --set primary.initdb.scriptsConfigMap=postgres-init-script \
  --set primary.persistence.enabled=false

# Install TimescaleDB for localization service
helm install fleet-localization-db bitnami/timescaledb -n database \
  --set auth.password=${DB_PASSWORD} \
  --set persistence.enabled=false
```

#### 3. Verify Databases

```bash
# Connect to PostgreSQL pod
kubectl exec -it svc/fleet-db-postgresql -n database -- psql -U postgres

# List databases
\l

# Exit
\q
```

## Kafka Configuration

### Topics Configuration

Kafka topics are defined in [kubernetes/infrastructure/kafka/topics.yaml](kubernetes/infrastructure/kafka/topics.yaml).

**Topics:**

- `driver.assigned` - When a driver is assigned to a vehicle
- `vehicle.updated` - When vehicle status changes
- `maintenance.alert` - Maintenance/intervention alerts
- `geofence.alert` - Geofence violations
- `fleet.vehicle.status` - Fleet vehicle status updates
- `fleet.location.raw` - Raw GPS location data
- `fleet.maintenance.alerts` - Maintenance alerts
- `fleet.system.logs` - System logs from all services

### Local Development

Kafka is automatically started in Docker Compose. Topics are auto-created if `KAFKA_AUTO_CREATE_TOPICS_ENABLE=true`.

Verify with:

```bash
docker-compose exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --list
```

### Kubernetes Deployment

```bash
# Apply Kafka topics
kubectl apply -f kubernetes/infrastructure/kafka/topics.yaml -n fleet-manager

# Verify topics
kubectl get kafkatopic -n fleet-manager
```

## Microservices Kafka Events

Each microservice publishes events when data changes. The Event Service consumes all events and stores them in the `logs_events` table.

### Event Flow

```
Service Event (Create/Update)
    ↓
Symfony Messenger Message
    ↓
Message Handler
    ↓
KafkaService.publishEvent()
    ↓
Kafka Topic
    ↓
Event Service Consumer
    ↓
PostgreSQL logs_events table
```

### Example: Vehicle Status Changed

**Producer:** Vehicle Service
**Topic:** `vehicle.updated`
**Message Format:**

```json
{
  "event": "VEHICLE_STATUS_CHANGED",
  "timestamp": "2026-05-14T10:00:00Z",
  "payload": {
    "vehicle_id": "uuid-v123",
    "old_status": "disponible",
    "new_status": "en_mission"
  }
}
```

### Query Events

Use Event Service API:

```bash
# Get all events
curl http://localhost:8085/events

# Get events by type
curl "http://localhost:8085/events?event_type=VEHICLE_STATUS_CHANGED"

# Get events by topic
curl "http://localhost:8085/events?topic=vehicle.updated"

# Get event statistics
curl http://localhost:8085/events/stats
```

## Kubernetes Deployment

### 1. Prerequisites

```bash
# Start Minikube
minikube start --driver=docker \
  --extra-config=kubeadm.ignore-preflight-errors=Swap \
  --extra-config=kubelet.enforce-node-allocatable=""

# Enable ingress addon (optional)
minikube addons enable ingress
```

### 2. Create Namespace and Secrets

```bash
# Create namespace
kubectl create namespace fleet-manager

# Create global config
kubectl create configmap global-fleet-config \
  --from-env-file=.env \
  -n fleet-manager
```

### 3. Deploy Infrastructure (Kafka, Databases)

```bash
# Create database namespace
kubectl create namespace database

# Install databases (see Database Setup above)

# Deploy Kafka infrastructure
kubectl apply -f kubernetes/infrastructure/kafka/ -n fleet-manager
```

### 4. Deploy Microservices

```bash
# Apply service manifests
kubectl apply -f kubernetes/services/ -n fleet-manager

# Verify deployments
kubectl get pods -n fleet-manager
kubectl get svc -n fleet-manager
```

### 5. Run Migrations

```bash
# For services that need database setup:
kubectl exec -it deploy/vehicle-service -n fleet-manager -- \
  php bin/console doctrine:migrations:migrate --no-interaction

kubectl exec -it deploy/conductor-service -n fleet-manager -- \
  php bin/console doctrine:migrations:migrate --no-interaction

kubectl exec -it deploy/maintenance-service -n fleet-manager -- \
  php bin/console doctrine:migrations:migrate --no-interaction
```

### 6. Verify Services

```bash
# Check all pods
kubectl get pods -n fleet-manager

# Check logs
kubectl logs -l app=vehicle-service -n fleet-manager -f

# Port-forward to test services
kubectl port-forward svc/api-gateway 8088:80 -n fleet-manager
```

## Authentication (Keycloak)

### Get Access Token

```bash
curl -X POST 'http://localhost:8080/realms/fleet-manager/protocol/openid-connect/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=password' \
  -d 'client_id=api-gateway' \
  -d 'client_secret=dzT2qEBxZKstFp0iZo4x0rNnhEMmjMUu' \
  -d 'username=USER' \
  -d 'password=PASS' \
  -d 'scope=openid'
```

### Use Token in API Calls

In GraphQL Apollo Client, add header:

```
Authorization: Bearer <access_token>
```

## Troubleshooting

### Migrations Not Running

```bash
# Re-run migrations in Docker container
docker-compose exec vehicle-service php bin/console doctrine:migrations:migrate --no-interaction --force

# Or in Kubernetes
kubectl exec -it deploy/vehicle-service -n fleet-manager -- \
  php bin/console doctrine:migrations:migrate --no-interaction --force
```

### Kafka Connection Issues

```bash
# Test Kafka connectivity
docker-compose exec vehicle-service curl -v kafka:9092

# Check Kafka broker
docker-compose logs kafka | grep -i "started"
```

### Database Connection Issues

Ensure `serverVersion=16` is in DATABASE_URL:

```
DATABASE_URL=postgresql://user:pass@host:5432/db?serverVersion=16
```

### Event Service Not Consuming

```bash
# Check Event Service logs
docker-compose logs event-service

# Verify database connection
docker-compose exec event-service python -c "import asyncpg; print('OK')"
```

## Architecture Overview

### Microservices

- **Vehicle Service** (PHP/Symfony) - Manage vehicles
- **Conductor Service** (PHP/Symfony) - Manage drivers/conductors
- **Maintenance Service** (PHP/Symfony) - Track maintenance tasks
- **Localization Service** (Go) - GPS tracking and location services
- **Event Service** (Python/FastAPI) - Centralized event logging

### Infrastructure

- **Kafka** - Event streaming
- **PostgreSQL** - Relational data storage
- **TimescaleDB** - Time-series location data
- **Keycloak** - Authentication/Authorization
- **API Gateway** - GraphQL unified interface
- **Frontend** - Angular web application

### Data Flow

```
User Actions → Frontend → API Gateway → Microservices
                                              ↓
                                        Kafka Events
                                              ↓
                                       Event Service
                                              ↓
                                         PostgreSQL
```

## Next Steps

1. **Deploy to Kubernetes** - Follow the K8S deployment steps above
2. **Configure Observability** - Set up Jaeger, Prometheus, Grafana
3. **Add Tests** - Implement unit and integration tests
4. **Set Up CI/CD** - GitHub Actions, GitLab CI, or Jenkins pipeline

## Support & Documentation

- [Database Setup](kubernetes/infrastructure/database/Database.md)
- [Kafka Configuration](kubernetes/infrastructure/kafka/Kafka.md)
- [Kubernetes Deployment](kubernetes/K8S.md)
- [Observability Setup](kubernetes/infrastructure/observabilite/Observabilite.md)

## Environment Variables Reference

```bash
# Database
DB_USER=postgres
DB_PASSWORD=fleetmanager
DB_NAME=fleetmanager

# Kafka
KAFKA_BROKERS=kafka:9092
ENQUEUE_DSN=kafka://kafka:9092

# Application
APP_ENV=dev
APP_SECRET=your-secret-key
DEFAULT_URI=http://localhost
CORS_ALLOW_ORIGIN=*

# Services URLs (for API Gateway)
VEHICLE_SERVICE_URL=http://vehicle-service:80
CONDUCTOR_SERVICE_URL=http://conductor-service:80
MAINTENANCE_SERVICE_URL=http://maintenance-service:80
LOCALIZATION_SERVICE_URL=http://localization-service:8000
```

---

**Last Updated:** May 14, 2026
**Version:** 1.0.0

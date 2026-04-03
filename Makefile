# --- Vars ---
NS_APP = fleet-manager
NS_OBS = observabilite
OTEL_IMAGE = otel/opentelemetry-collector-contrib:0.147.0
JAEGER_IMAGE = jaegertracing/jaeger:2.16.0

up: build pull-infra load setup apply
	@echo "FleetManager is launching..."

# --- Build & Pull  ---
build:
	docker compose build

pull-infra:
	docker pull postgres:16.2-alpine
	docker pull redis:7.2-alpine
	docker pull $(OTEL_IMAGE)
	docker pull $(JAEGER_IMAGE)
	docker pull nginxinc/nginx-unprivileged:1.29-alpine

load:
	@echo "📦 Loading images into Minikube..."
	minikube image load fleetmanager-vehicle-service:latest
	minikube image load fleetmanager-conductor-service:latest
	minikube image load fleetmanager-maintenance-service:latest
	minikube image load fleetmanager-localization-service:latest
	minikube image load fleetmanager-event-service:latest
	minikube image load postgres:16.2-alpine
	minikube image load redis:7.2-alpine
	minikube image load $(OTEL_IMAGE)
	minikube image load $(JAEGER_IMAGE)
	minikube image load nginxinc/nginx-unprivileged:1.29-alpine

# --- Setup (Namespaces & ConfigMaps) ---
setup:
	@echo "Configuring the Cluster Brain..."
	kubectl create namespace $(NS_APP) --dry-run=client -o yaml | kubectl apply -f -
	kubectl create namespace $(NS_OBS) --dry-run=client -o yaml | kubectl apply -f -
	# Create App Config with DB and OTEL Endpoints
	kubectl create configmap fleet-config -n $(NS_APP) \
		--from-literal=DATABASE_HOST="postgresql://postgres:sidou_password@fleet-db-postgresql:5432/postgres" \
		--from-literal=REDIS_URL="redis://fleet-redis-master:6379" \
		--from-literal=OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector-opentelemetry-collector.$(NS_OBS).svc.cluster.local:4318" \
		--dry-run=client -o yaml | kubectl apply -f -
	# Create OTEL ServiceAccount & ConfigMap
	kubectl create serviceaccount otel-collector-opentelemetry-collector -n $(NS_OBS) --dry-run=client -o yaml | kubectl apply -f -
	kubectl create configmap otel-collector-opentelemetry-collector -n $(NS_OBS) \
		--from-literal=relay="$$(cat infra/k8s/observabilite/otel-config-raw.yaml 2>/dev/null || echo 'Check your raw config file!')" \
		--dry-run=client -o yaml | kubectl apply -f -

# --- Apply YAML Blueprints ---
apply:
	kubectl apply -f infra/k8s/database/
	kubectl apply -f infra/k8s/observabilite/
	kubectl apply -f kubernetes/services/

# --- Monitoring & Logs ---
status:
	@echo "--- Apps ---"
	kubectl get pods -n $(NS_APP)
	@echo "--- Observability ---"
	kubectl get pods -n $(NS_OBS)

watch:
	kubectl get pods -A -w

logs-apps:
	kubectl logs -n $(NS_APP) -l version=latest --all-containers -f

logs-otel:
	kubectl logs -n $(NS_OBS) -l app.kubernetes.io/name=opentelemetry-collector -f

# --- Dashboards  ---
jaeger:
	kubectl port-forward -n $(NS_OBS) svc/jaeger 16686:16686

# --- 7. Cleanup ---
down:
	kubectl delete namespace $(NS_APP)
	kubectl delete namespace $(NS_OBS)
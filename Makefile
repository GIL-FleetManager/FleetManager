# --- Vars ---
NS_APP = fleet-manager
NS_OBS = observabilite
OTEL_IMAGE = otel/opentelemetry-collector-contrib:0.147.0
JAEGER_IMAGE = jaegertracing/jaeger:2.16.0

compose-up:
	docker compose up --build -d

compose-down:
	docker compose down -v

up: cluster build pull-infra load setup apply
	@echo "FleetManager is launching on Kubernetes..."

cluster:
	@echo "Starting Minikube with resource boost for Arch Linux..."
	minikube start --driver=docker --cpus=4 --memory=8192 --disk-size=20g

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
	@echo "Loading images into Minikube..."
	minikube image load fleetmanager-vehicle-service:latest --overwrite
	minikube image load fleetmanager-conductor-service:latest --overwrite
	minikube image load fleetmanager-maintenance-service:latest --overwrite
	minikube image load fleetmanager-localization-service:latest --overwrite
	minikube image load fleetmanager-event-service:latest --overwrite
	minikube image load postgres:16.2-alpine --overwrite
	minikube image load redis:7.2-alpine --overwrite
	minikube image load $(OTEL_IMAGE) --overwrite
	minikube image load $(JAEGER_IMAGE) --overwrite
	minikube image load nginxinc/nginx-unprivileged:1.29-alpine --overwrite

# --- Setup (Namespaces & ConfigMaps) ---
setup:
	@echo "Configuring the Cluster Brain..."
	kubectl create namespace $(NS_APP) --dry-run=client -o yaml | kubectl apply -f -
	kubectl create namespace $(NS_OBS) --dry-run=client -o yaml | kubectl apply -f -
	kubectl create secret generic fleet-db-secret -n $(NS_APP) \
		--from-literal=password=$${DB_PASSWORD} \
		--dry-run=client -o yaml | kubectl apply -f -

# --- Apply YAML Blueprints ---
apply:
	kubectl apply -f infra/k8s/database/
	kubectl apply -f infra/k8s/observabilite/
	kubectl apply -f kubernetes/services/

# --- 3. UTILS ---
down:
	kubectl delete namespace $(NS_APP)
	kubectl delete namespace $(NS_OBS)

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


1. Initialisation
PowerShell
kubectl create namespace database
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add strimzi https://strimzi.io/charts/
helm repo update
2. PostgreSQL & Redis (Helm)
PowerShell
# PostgreSQL (Pass: sidou_password)
helm install fleet-db bitnami/postgresql -n database `
  --set auth.postgresPassword=sidou_password --set primary.persistence.enabled=false

# Redis (Standalone)
helm install fleet-redis bitnami/redis -n database `
  --set architecture=standalone --set auth.enabled=false --set master.persistence.enabled=false
3. Kafka (Strimzi Operator)
PowerShell
# Installation de l'Opérateur
helm install strimzi-operator strimzi/strimzi-kafka-operator -n database `
  --set "watchNamespaces={database}"

# Déploiement du Cluster (KRaft mode)
kubectl apply -f infra/k8s/fleet-kafka.yaml
📊 État Final Attendu (1/1 Running)
✅ fleet-db-postgresql-0
✅ fleet-redis-master-0
✅ strimzi-cluster-operator-xxx
✅ fleet-kafka-fleet-kafka-pool-0
✅ fleet-kafka-entity-operator-xxx



tester la bdd 
kubectl run fleet-db-client --rm --tty -i --restart='Never' --namespace database --image bitnami/postgresql --env="PGPASSWORD=sidou_password" -- psql --host fleet-db-postgresql -U postgres -d postgres
## 1. Ajouter le repo Strimzi

```bash
helm repo add strimzi https://strimzi.io/charts/
helm repo update
```

## 3. Kafka (Strimzi Operator)

Installation de l'Opérateur

```bash
helm install strimzi-operator strimzi/strimzi-kafka-operator -n fleet-manager `
  --set "watchNamespaces={fleet-manager}"
```

## 4. Déploiement du Cluster (KRaft mode)

```bash
kubectl apply -f kubernetes/infrastructure/kafka/fleet-kafka.yaml
kubectl apply -f kubernetes/infrastructure/kafka/topics.yaml
```
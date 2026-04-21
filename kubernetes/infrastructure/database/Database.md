# Database Infrastructure

We use a single PostgreSQL instance with isolated logical databases to respect the **Database per Service** pattern while saving cluster resources.

## Create Database Namespace

```bash
kubectl create namespace database
```

## Install PostgreSQL

```bash
helm install fleet-db bitnami/postgresql -n database \
  --set auth.postgresPassword=${DB_PASSWORD} \
  --set primary.initdb.scriptsConfigMap=postgres-init-script \
  --set primary.persistence.enabled=false
```

## Install TImeScaleDB

```bash
helm install fleet-localization-db bitnami/timescaledb -n database \
  --set auth.password=${DB_PASSWORD} \
  --set persistence.enabled=false
```

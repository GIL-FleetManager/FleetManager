# Migrations Runbook

## How Migrations Work

Each Symfony service manages its own database schema via Doctrine Migrations.
Migrations live in `services/<name>/migrations/` and must be committed to git.

## First-Time Setup (new cluster or after DB reset)

Run this for each service after the DB is up:

```bash
for svc in conductor vehicle maintenance; do
  POD=$(kubectl get pod -l app=${svc}-service -n fleet-manager -o jsonpath='{.items[0].metadata.name}')
  kubectl exec -it $POD -n fleet-manager -- sh -c "
    php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration
  "
done
```

## Adding a New Migration (after entity changes)

```bash
# 1. Generate the migration inside the pod
POD=$(kubectl get pod -l app=conductor-service -n fleet-manager -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it $POD -n fleet-manager -- php bin/console doctrine:migrations:diff

# 2. Copy it out before the pod restarts (it will be lost otherwise!)
kubectl exec -it $POD -n fleet-manager -- cat /app/migrations/Version<timestamp>.php \
  > services/conductor-service/migrations/Version<timestamp>.php

# 3. Commit it
git add services/conductor-service/migrations/
git commit -m "feat: add migration for conductor schema change"

# 4. Rebuild the image so the migration is baked in
docker build -t fleetmanager-conductor-service:vX ./services/conductor-service
minikube image load fleetmanager-conductor-service:vX
kubectl set image deployment/conductor-service \
  conductor-service=fleetmanager-conductor-service:vX -n fleet-manager
```

## Fixing "Duplicate table" or "Table does not exist" Errors

This happens when the migration history in the DB is out of sync with the
migration files. Fix by manually marking migrations as executed:

```bash
POD=$(kubectl get pod -l app=conductor-service -n fleet-manager -o jsonpath='{.items[0].metadata.name}')

# Mark a migration as already run (without executing it)
kubectl exec -it $POD -n fleet-manager -- sh -c "
  php bin/console dbal:run-sql \"INSERT INTO doctrine_migration_versions (version, executed_at, execution_time) VALUES ('DoctrineMigrations\\\\Version<timestamp>', NOW(), 0)\"
"

# Check status
kubectl exec -it $POD -n fleet-manager -- php bin/console doctrine:migrations:status
```

## Critical Rules

1. **Always copy migrations out of the pod** — they are lost on pod restart
2. **Always commit migrations to git** — they must be baked into the Docker image
3. **Never use `doctrine:schema:update --force`** in production — use migrations only
4. **One migration file per service** — each service has its own DB and migration history
5. **Migration files are append-only** — never edit an already-executed migration,
   create a new one instead

## Database Password

The PostgreSQL password is `sidou_password`, set via Helm at install time.
Each service's `DATABASE_URL` uses this password — defined in the `global-fleet-config`
ConfigMap in the `fleet-manager` namespace.

To verify connectivity:
```bash
kubectl exec -it fleet-db-postgresql-0 -n database -- \
  bash -c "PGPASSWORD=sidou_password psql -U postgres -c '\l'"
```

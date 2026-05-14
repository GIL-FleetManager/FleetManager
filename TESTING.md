# FleetManager - Complete Testing Guide

**Environment:** Kubernetes (Minikube)  
**Status:** Ready to test  
**Last Updated:** May 14, 2026

## 🔧 Prerequisites

### 1. Verify Services are Running

```bash
# Check all services in the fleet-manager namespace
kubectl get pods -n fleet-manager

# Expected output:
# NAME                                    READY   STATUS    RESTARTS   AGE
# api-gateway-xxx                         1/1     Running   0          10m
# vehicle-service-xxx                     1/1     Running   0          10m
# conductor-service-xxx                   1/1     Running   0          10m
# maintenance-service-xxx                 1/1     Running   0          10m
# event-service-xxx                       1/1     Running   0          10m
# localization-service-xxx                1/1     Running   0          10m
# kafka-0                                 1/1     Running   0          10m
# fleet-db-xxx                            1/1     Running   0          10m
```

### 2. Get API Gateway IP

```bash
# Get the LoadBalancer IP/Port
kubectl get svc api-gateway -n fleet-manager

# Get the NodePort (if LoadBalancer not available)
kubectl get svc api-gateway -n fleet-manager -o jsonpath='{.spec.ports[0].nodePort}'

# For local testing, port-forward to the API gateway
kubectl port-forward svc/api-gateway 3000:3000 -n fleet-manager &

# Now API is available at: http://localhost:3000
```

### 3. Get GraphQL Endpoint

```bash
# GraphQL is available at:
http://localhost:3000/graphql

# Test it:
curl http://localhost:3000/graphql -X OPTIONS -v
```

### 4. Verify Database Connection

```bash
# Get database pod name
DB_POD=$(kubectl get pods -n fleet-manager -l app=fleet-db -o jsonpath='{.items[0].metadata.name}')

# Connect to database
kubectl exec -it $DB_POD -n fleet-manager -- psql -U fleet_admin -d fleetmanager

# Inside psql, verify tables exist:
\dt

# Exit with \q
```

### 5. Verify Kafka Topics

```bash
# Get Kafka pod name
KAFKA_POD=$(kubectl get pods -n fleet-manager -l app=kafka -o jsonk jsonpath='{.items[0].metadata.name}')

# List all topics
kubectl exec -it $KAFKA_POD -n fleet-manager -- /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --list

# Expected topics:
# vehicle.updated
# driver.assigned
# maintenance.alert
# geofence.alert
# fleet.vehicle.status
# fleet.location.raw
# fleet.maintenance.alerts
# fleet.system.logs
```

---

## 🧪 Test Scenarios

### Test Scenario 1: Create and Manage Vehicles

**Purpose:** Verify vehicle creation and status tracking  
**Duration:** ~5 minutes

#### Step 1: Create a Vehicle

```bash
# GraphQL Mutation
curl -X POST http://localhost:8001/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "
      mutation CreateVehicule {
        createVehicule(
          immatriculation: \"AB-123-CD\"
          marque: \"Peugeot\"
          modele: \"208\"
          statut: \"disponible\"
        ) {
          id
          immatriculation
          marque
          modele
          statut
        }
      }
    "
  }'
```

**Expected Response:**

```json
{
  "data": {
    "createVehicule": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "immatriculation": "AB-123-CD",
      "marque": "Peugeot",
      "modele": "208",
      "statut": "disponible"
    }
  }
}
```

**Save the ID:**

```bash
export VEHICLE_ID="550e8400-e29b-41d4-a716-446655440000"
```

#### Step 2: Verify Event Published to Kafka

```bash
# Check if vehicle.updated topic has messages
KAFKA_POD=$(kubectl get pods -n fleet-manager -l app=kafka -o jsonpath='{.items[0].metadata.name}')

kubectl exec -it $KAFKA_POD -n fleet-manager -- /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic vehicle.updated \
  --from-beginning \
  --max-messages 1 \
  --timeout-ms 5000
```

**Expected:** Message with vehicle creation event and timestamp

#### Step 3: Verify Event Stored in Event Service

```bash
# Query Event Service for events
curl http://localhost:3000/graphql \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "query": "
      query {
        events {
          id
          event_type
          topic
          source_service
          timestamp
        }
      }
    "
  }'
```

**Expected:** Event with `event_type: "VEHICLE_CREATED"` and `topic: "vehicle.updated"`

#### Step 4: Update Vehicle Status

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "
      mutation UpdateVehicule {
        updateVehicule(
          id: \"'$VEHICLE_ID'\"
          statut: \"en_maintenance\"
        ) {
          id
          statut
        }
      }
    "
  }'
```

**Verification:**

- ✅ Vehicle status changed to `en_maintenance`
- ✅ New event published to Kafka
- ✅ Event stored in database

---

### Test Scenario 2: Create and Assign Technician to Vehicle

**Purpose:** Verify technician creation and vehicle assignment  
**Duration:** ~5 minutes

#### Step 1: Create a Technician

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "
      mutation CreateConducteur {
        createConducteur(
          nom: \"Dupont\"
          prenom: \"Jean\"
          email: \"jean.dupont@fleetmanager.fr\"
          telephone: \"+33612345678\"
          numero_permis: \"FR-ABC-123\"
          date_expiration_permis: \"2030-12-31\"
          statut: \"actif\"
        ) {
          id
          nom
          prenom
          email
          statut
        }
      }
    "
  }'
```

**Expected Response:**

```json
{
  "data": {
    "createConducteur": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@fleetmanager.fr",
      "statut": "actif"
    }
  }
}
```

**Save the ID:**

```bash
export CONDUCTOR_ID="660e8400-e29b-41d4-a716-446655440001"
```

#### Step 2: Assign Technician to Vehicle

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "
      mutation AssignVehicleToConductor {
        assignVehicleToConductor(
          conductor_id: \"'$CONDUCTOR_ID'\"
          vehicle_id: \"'$VEHICLE_ID'\"
        ) {
          id
          conductor_id
          vehicle_id
          assigned_at
        }
      }
    "
  }'
```

**Expected:** Assignment created with `assigned_at` timestamp

#### Step 3: Verify Event Published

```bash
# Check driver.assigned topic
KAFKA_POD=$(kubectl get pods -n fleet-manager -l app=kafka -o jsonpath='{.items[0].metadata.name}')

kubectl exec -it $KAFKA_POD -n fleet-manager -- /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic driver.assigned \
  --from-beginning \
  --max-messages 1 \
  --timeout-ms 5000
```

**Verification:**

- ✅ Assignment created in database
- ✅ Event published to `driver.assigned` topic
- ✅ Event stored in Event Service

---

### Test Scenario 3: Geolocation and GPS Tracking

**Purpose:** Verify location tracking and geofence events  
**Duration:** ~5 minutes

#### Step 1: Send GPS Location

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "
      mutation SendLocation {
        sendLocation(
          vehicle_id: \"'$VEHICLE_ID'\"
          latitude: 48.8566
          longitude: 2.3522
          speed: 45.5
          heading: 180
        ) {
          id
          vehicle_id
          latitude
          longitude
          speed
          timestamp
        }
      }
    "
  }'
```

**Expected:**

```json
{
  "data": {
    "sendLocation": {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "vehicle_id": "550e8400-e29b-41d4-a716-446655440000",
      "latitude": 48.8566,
      "longitude": 2.3522,
      "speed": 45.5,
      "timestamp": "2026-05-14T15:30:00Z"
    }
  }
}
```

#### Step 2: Get Latest Location

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "
      query GetLastLocation {
        getLastLocation(vehicleId: \"'$VEHICLE_ID'\") {
          id
          latitude
          longitude
          speed
          heading
          timestamp
        }
      }
    "
  }'
```

#### Step 3: Verify Location Event in Kafka

```bash
KAFKA_POD=$(kubectl get pods -n fleet-manager -l app=kafka -o jsonpath='{.items[0].metadata.name}')

kubectl exec -it $KAFKA_POD -n fleet-manager -- /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic fleet.location.raw \
  --from-beginning \
  --max-messages 1 \
  --timeout-ms 5000
```

#### Step 4: Verify Location Event Stored

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "
      query GetEvents {
        events(filter: {topic: \"fleet.location.raw\", limit: 5}) {
          id
          event_type
          topic
          payload
          timestamp
        }
      }
    "
  }'
```

**Verification:**

- ✅ Location saved to database
- ✅ Event published to `fleet.location.raw` topic
- ✅ Event queryable from Event Service

---

### Test Scenario 4: Create and Track Maintenance

**Purpose:** Verify maintenance intervention workflow  
**Duration:** ~5 minutes

#### Step 1: Create a Maintenance Intervention

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "
      mutation CreateIntervention {
        createIntervention(
          vehicule_id: \"'$VEHICLE_ID'\"
          technicien_id: \"'$CONDUCTOR_ID'\"
          type_intervention: \"maintenance_preventive\"
          date_planifiee: \"2026-05-20\"
          description: \"Changement d'huile\"
          statut: \"planifie\"
        ) {
          id
          vehicule_id
          technicien_id
          type_intervention
          statut
          description
        }
      }
    "
  }'
```

**Expected Response:**

```json
{
  "data": {
    "createIntervention": {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "vehicule_id": "550e8400-e29b-41d4-a716-446655440000",
      "technicien_id": "660e8400-e29b-41d4-a716-446655440001",
      "type_intervention": "maintenance_preventive",
      "statut": "planifie",
      "description": "Changement d'huile"
    }
  }
}
```

**Save the ID:**

```bash
export INTERVENTION_ID="880e8400-e29b-41d4-a716-446655440003"
```

#### Step 2: Update Intervention Status

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "
      mutation UpdateIntervention {
        updateIntervention(
          id: \"'$INTERVENTION_ID'\"
          statut: \"en_cours\"
        ) {
          id
          statut
          description
        }
      }
    "
  }'
```

#### Step 3: Complete Maintenance

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "
      mutation UpdateIntervention {
        updateIntervention(
          id: \"'$INTERVENTION_ID'\"
          statut: \"termine\"
          date_realisation: \"2026-05-20\"
        ) {
          id
          statut
          date_realisation
        }
      }
    "
  }'
```

#### Step 4: Verify Event Published

```bash
KAFKA_POD=$(kubectl get pods -n fleet-manager -l app=kafka -o jsonpath='{.items[0].metadata.name}')

kubectl exec -it $KAFKA_POD -n fleet-manager -- /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic maintenance.alert \
  --from-beginning \
  --max-messages 1 \
  --timeout-ms 5000
```

**Verification:**

- ✅ Intervention created in database
- ✅ Status updates published to `maintenance.alert` topic
- ✅ Event stored in Event Service

---

### Test Scenario 5: Event Monitoring and Analytics

**Purpose:** Verify event querying and statistics  
**Duration:** ~5 minutes

#### Step 1: Get All Events

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "
      query GetAllEvents {
        events(limit: 20) {
          id
          event_type
          topic
          source_service
          payload
          timestamp
          created_at
        }
      }
    "
  }'
```

#### Step 2: Filter Events by Topic

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "
      query FilterEventsByTopic {
        events(filter: {topic: \"vehicle.updated\"}) {
          id
          event_type
          topic
          payload
          timestamp
        }
      }
    "
  }'
```

#### Step 3: Filter Events by Event Type

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "
      query FilterEventsByType {
        events(filter: {event_type: \"DRIVER_ASSIGNED\"}) {
          id
          event_type
          source_service
          payload
        }
      }
    "
  }'
```

#### Step 4: Get Event Statistics

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "
      query GetEventStats {
        eventStats {
          total_events
          events_by_topic {
            topic
            count
          }
          events_by_type {
            event_type
            count
          }
          events_by_service {
            source_service
            count
          }
        }
      }
    "
  }'
```

**Expected Response:**

```json
{
  "data": {
    "eventStats": {
      "total_events": 15,
      "events_by_topic": [
        {"topic": "vehicle.updated", "count": 3},
        {"topic": "driver.assigned", "count": 2},
        {"topic": "maintenance.alert", "count": 3},
        {"topic": "fleet.location.raw", "count": 7}
      ],
      "events_by_type": [...],
      "events_by_service": [...]
    }
  }
}
```

**Verification:**

- ✅ Can query events by topic
- ✅ Can query events by type
- ✅ Can get statistics
- ✅ Timestamps are consistent

---

### Test Scenario 6: GraphQL API Gateway Testing

**Purpose:** Verify GraphQL endpoint and full workflow  
**Duration:** ~5 minutes

#### Step 1: Test GraphQL Introspection

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "
      query IntrospectionQuery {
        __schema {
          types {
            name
            kind
          }
        }
      }
    "
  }'
```

#### Step 2: Get All Vehicles

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "
      query GetAllVehicles {
        vehicules {
          id
          immatriculation
          marque
          modele
          statut
        }
      }
    "
  }'
```

#### Step 3: Get All Conductors

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "
      query GetAllConductors {
        conducteurs {
          id
          nom
          prenom
          email
          statut
        }
      }
    "
  }'
```

#### Step 4: Get All Interventions

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "
      query GetAllInterventions {
        interventions {
          id
          vehicule_id
          technicien_id
          type_intervention
          statut
          date_planifiee
        }
      }
    "
  }'
```

---

## 🚨 Troubleshooting

### Issue: "Connection refused" or "Cannot reach API"

**Solution:**

```bash
# 1. Check if api-gateway is running
kubectl get pods -n fleet-manager | grep api-gateway

# 2. Check port-forward
kubectl port-forward svc/api-gateway 3000:3000 -n fleet-manager &

# 3. Verify port is open
curl http://localhost:3000/health
```

### Issue: "GraphQL query failed" or "Service not responding"

**Solution:**

```bash
# Check service logs
kubectl logs -f deployment/api-gateway -n fleet-manager

# Check if downstream services are healthy
kubectl get pods -n fleet-manager -o wide

# Restart the gateway if needed
kubectl rollout restart deployment/api-gateway -n fleet-manager
```

### Issue: "Events not appearing in Kafka"

**Solution:**

```bash
# Verify Kafka is running
kubectl get pods -n fleet-manager | grep kafka

# Check Kafka logs
kubectl logs -f kafka-0 -n fleet-manager

# Verify topics are created
kubectl exec -it kafka-0 -n fleet-manager -- \
  /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list
```

### Issue: "Database connection error"

**Solution:**

```bash
# Verify database pod is running
kubectl get pods -n fleet-manager | grep fleet-db

# Check if migrations ran
kubectl logs deployment/vehicle-service -n fleet-manager | grep migration

# Manually run migrations
kubectl exec -it <vehicle-service-pod> -n fleet-manager -- \
  php bin/console doctrine:migrations:migrate
```

### Issue: "No events in database"

**Solution:**

```bash
# Check event-service consumer logs
kubectl logs -f deployment/event-service -n fleet-manager

# Verify PostgreSQL has the logs_events table
DB_POD=$(kubectl get pods -n fleet-manager -l app=fleet-db -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it $DB_POD -n fleet-manager -- psql -U fleet_admin -d fleetmanager -c "SELECT COUNT(*) FROM logs_events;"

# Check if event-service can connect to Kafka
kubectl logs deployment/event-service -n fleet-manager | grep -i kafka
```

---

## 📊 Performance Testing

### Test 1: Create Multiple Vehicles (Batch Test)

```bash
#!/bin/bash
for i in {1..100}; do
  curl -s -X POST http://localhost:3000/graphql \
    -H "Content-Type: application/json" \
    -d '{
      "query": "
        mutation {
          createVehicule(
            immatriculation: \"'AB-$i-CD'\"
            marque: \"Test\"
            modele: \"Model\"
            statut: \"disponible\"
          ) { id }
        }
      "
    }' &
done
wait
```

**Expected:** All 100 vehicles created without errors

### Test 2: Rapid Location Updates

```bash
#!/bin/bash
for i in {1..50}; do
  LAT=$(echo "48.8566 + 0.$i" | bc)
  LON=$(echo "2.3522 + 0.$i" | bc)

  curl -s -X POST http://localhost:3000/graphql \
    -H "Content-Type: application/json" \
    -d '{
      "query": "
        mutation {
          sendLocation(
            vehicle_id: \"'$VEHICLE_ID'\"
            latitude: '$LAT'
            longitude: '$LON'
            speed: 50
            heading: 180
          ) { id }
        }
      "
    }' &
done
wait
```

**Expected:** All 50 locations saved and events published

### Test 3: Event Query Performance

```bash
time curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "
      query {
        events(limit: 1000) {
          id
          event_type
          timestamp
        }
      }
    "
  }'
```

**Expected:** Query completes in < 2 seconds for 1000 events

---

## ✅ Full Testing Checklist

### Core Features

- [ ] Create vehicle → Event published ✅
- [ ] Update vehicle status → Event published ✅
- [ ] Create conductor → Works ✅
- [ ] Assign conductor to vehicle → Event published ✅
- [ ] Create intervention → Event published ✅
- [ ] Update intervention → Event published ✅
- [ ] Send location → Event published ✅

### Event Service

- [ ] Events stored in database ✅
- [ ] Events queryable by type ✅
- [ ] Events queryable by topic ✅
- [ ] Events queryable by service ✅
- [ ] Statistics endpoint works ✅
- [ ] Pagination works ✅

### Kafka

- [ ] Topics exist ✅
- [ ] Messages published to topics ✅
- [ ] Messages consumed by event-service ✅
- [ ] No message loss ✅

### API Gateway

- [ ] GraphQL endpoint responds ✅
- [ ] Mutations work ✅
- [ ] Queries work ✅
- [ ] Introspection works ✅

### Database

- [ ] All tables created ✅
- [ ] Migrations applied ✅
- [ ] Foreign keys working ✅
- [ ] Events logged ✅

---

## 📞 Quick Help

**Port-forward API Gateway:**

```bash
kubectl port-forward svc/api-gateway 3000:3000 -n fleet-manager &
```

**Check All Services:**

```bash
kubectl get all -n fleet-manager
```

**View Service Logs:**

```bash
kubectl logs -f deployment/<service-name> -n fleet-manager
```

**Restart a Service:**

```bash
kubectl rollout restart deployment/<service-name> -n fleet-manager
```

**Connect to Database:**

```bash
DB_POD=$(kubectl get pods -n fleet-manager -l app=fleet-db -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it $DB_POD -n fleet-manager -- psql -U fleet_admin -d fleetmanager
```

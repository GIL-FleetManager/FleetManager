

# Vehicle Service — CRUD API

## Lancer le service

```bash
# Dans le dossier services/vehicle-service
cd services/vehicle-service

docker compose up --build -d

# Créer la table (première fois uniquement)
docker exec vehicle-service php bin/console doctrine:schema:create
```

Service disponible sur **http://localhost:8001**

## Tester avec Postman

| Méthode | URL | Description |
|---|---|---|
| GET | `http://localhost:8001/api/vehicles` | Liste tous les véhicules |
| POST | `http://localhost:8001/api/vehicles` | Créer un véhicule |
| GET | `http://localhost:8001/api/vehicles/{id}` | Détails d'un véhicule |
| PUT | `http://localhost:8001/api/vehicles/{id}` | Modifier un véhicule |
| DELETE | `http://localhost:8001/api/vehicles/{id}` | Supprimer un véhicule |

**Body POST/PUT :**
```json
{
  "immatriculation": "AB-123-CD",
  "marque": "Renault",
  "modele": "Clio",
  "statut": "disponible"
}
```

## Commandes utiles

```bash
# Arrêter le service
docker compose down

# Relancer sans rebuild
docker compose up -d


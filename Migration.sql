-- 1. Service Véhicules
DROP TABLE IF EXISTS vehicules CASCADE;
DROP TYPE IF EXISTS vehicle_status CASCADE;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE vehicle_status AS ENUM ('disponible', 'en_mission', 'maint.');

CREATE TABLE vehicules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    immatriculation VARCHAR(20) UNIQUE NOT NULL,
    marque VARCHAR(50) NOT NULL,
    modele VARCHAR(50) NOT NULL,
    annee INTEGER,
    statut vehicle_status NOT NULL DEFAULT 'disponible',
    conducteur_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Service Conducteurs
DROP TABLE IF EXISTS conducteurs CASCADE;
DROP TYPE IF EXISTS driver_status CASCADE;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE driver_status AS ENUM ('actif', 'inactif', 'suspendu');

CREATE TABLE conducteurs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telephone VARCHAR(20),
    numero_permis VARCHAR(30) UNIQUE NOT NULL,
    date_expiration_permis DATE NOT NULL,
    statut driver_status NOT NULL DEFAULT 'actif',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Service Maintenance
DROP TABLE IF EXISTS interventions CASCADE;
DROP TABLE IF EXISTS techniciens CASCADE;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE techniciens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    specialisation VARCHAR(50),
    statut VARCHAR(20) DEFAULT 'disponible'
);

CREATE TABLE interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicule_id UUID NOT NULL, 
    technicien_id UUID REFERENCES techniciens(id),
    type_intervention VARCHAR(100) NOT NULL,
    date_planifiee DATE NOT NULL,
    date_realisation DATE,
    statut VARCHAR(20) NOT NULL DEFAULT 'planifie',
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Service Localisation
DROP TABLE IF EXISTS positions CASCADE;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "timescaledb";

CREATE TABLE positions (
    id UUID DEFAULT gen_random_uuid(),
    vehicule_id UUID NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    vitesse DECIMAL(5,2),
    time TIMESTAMPTZ NOT NULL
);

-- Conversion en hypertable
SELECT create_hypertable('positions', 'time', if_not_exists => TRUE);

-- 5. Service Événements
DROP TABLE IF EXISTS logs_events CASCADE;

CREATE TABLE logs_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_event VARCHAR(50) NOT NULL,
    vehicule_id UUID,
    source_service VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    niveau VARCHAR(20) NOT NULL,
    date_eve TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
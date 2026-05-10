/**
 * Seed script - populates vehicles, conductors, interventions via GraphQL
 * Usage: node seed.js
 * Requires: npm install node-fetch (or use built-in fetch in Node 18+)
 *
 * Get a token first:
 * export TOKEN=$(curl -s -X POST http://localhost:30080/realms/fleet-manager/protocol/openid-connect/token \
 *   -d "client_id=fleet-frontend&grant_type=password&username=younes-admin&password=YOUR_PASSWORD" \
 *   | jq -r .access_token)
 * node seed.js
 */

const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:30081/graphql";
const TOKEN = process.env.TOKEN || "";

async function gql(query, variables = {}) {
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const data = await res.json();
  if (data.errors) {
    console.error("GraphQL Error:", JSON.stringify(data.errors, null, 2));
    return null;
  }
  return data.data;
}

// --- VEHICLES ---
const VEHICLES = [
  {
    immatriculation: "AA-123-BB",
    marque: "Renault",
    modele: "Clio",
    statut: "disponible",
  },
  {
    immatriculation: "CC-456-DD",
    marque: "Peugeot",
    modele: "308",
    statut: "disponible",
  },
  {
    immatriculation: "EE-789-FF",
    marque: "Citroën",
    modele: "C3",
    statut: "en_mission",
  },
  {
    immatriculation: "GG-012-HH",
    marque: "Renault",
    modele: "Megane",
    statut: "disponible",
  },
  {
    immatriculation: "II-345-JJ",
    marque: "Peugeot",
    modele: "208",
    statut: "maint.",
  },
  {
    immatriculation: "KK-678-LL",
    marque: "Ford",
    modele: "Focus",
    statut: "disponible",
  },
  {
    immatriculation: "MM-901-NN",
    marque: "Volkswagen",
    modele: "Golf",
    statut: "en_mission",
  },
];

// --- CONDUCTORS ---
const CONDUCTORS = [
  {
    nom: "Martin",
    prenom: "Jean",
    email: "jean.martin@fleet.fr",
    telephone: "0612345678",
    numero_permis: "PM-001-2020",
    date_expiration_permis: "2028-06-15",
    statut: "actif",
  },
  {
    nom: "Dupont",
    prenom: "Marie",
    email: "marie.dupont@fleet.fr",
    telephone: "0623456789",
    numero_permis: "PM-002-2019",
    date_expiration_permis: "2027-03-20",
    statut: "actif",
  },
  {
    nom: "Bernard",
    prenom: "Pierre",
    email: "pierre.bernard@fleet.fr",
    telephone: "0634567890",
    numero_permis: "PM-003-2021",
    date_expiration_permis: "2029-11-30",
    statut: "actif",
  },
  {
    nom: "Leroy",
    prenom: "Sophie",
    email: "sophie.leroy@fleet.fr",
    telephone: "0645678901",
    numero_permis: "PM-004-2018",
    date_expiration_permis: "2026-08-10",
    statut: "actif",
  },
  {
    nom: "Moreau",
    prenom: "Lucas",
    email: "lucas.moreau@fleet.fr",
    telephone: "0656789012",
    numero_permis: "PM-005-2022",
    date_expiration_permis: "2030-01-25",
    statut: "actif",
  },
  {
    nom: "Simon",
    prenom: "Emma",
    email: "emma.simon@fleet.fr",
    telephone: "0667890123",
    numero_permis: "PM-006-2020",
    date_expiration_permis: "2028-09-05",
    statut: "inactif",
  },
  {
    nom: "Laurent",
    prenom: "Thomas",
    email: "thomas.laurent@fleet.fr",
    telephone: "0678901234",
    numero_permis: "PM-007-2021",
    date_expiration_permis: "2029-04-18",
    statut: "actif",
  },
];

async function seedVehicles() {
  console.log("\n🚗 Seeding vehicles...");
  const ids = [];
  for (const v of VEHICLES) {
    const data = await gql(
      `
      mutation CreateVehicule($immatriculation: String!, $marque: String!, $modele: String!, $statut: String!) {
        createVehicule(immatriculation: $immatriculation, marque: $marque, modele: $modele, statut: $statut) {
          id immatriculation marque modele
        }
      }
    `,
      v,
    );
    if (data?.createVehicule) {
      console.log(
        `  ✅ ${v.marque} ${v.modele} (${v.immatriculation}) → id: ${data.createVehicule.id}`,
      );
      ids.push(data.createVehicule.id);
    }
  }
  return ids;
}

async function seedConductors() {
  console.log("\n👤 Seeding conductors...");
  const ids = [];
  for (const c of CONDUCTORS) {
    const data = await gql(
      `
      mutation CreateConducteur($nom: String!, $prenom: String!, $email: String!, $telephone: String, $numero_permis: String!, $date_expiration_permis: String!, $statut: String) {
        createConducteur(nom: $nom, prenom: $prenom, email: $email, telephone: $telephone, numero_permis: $numero_permis, date_expiration_permis: $date_expiration_permis, statut: $statut) {
          id nom prenom
        }
      }
    `,
      c,
    );
    if (data?.createConducteur) {
      console.log(
        `  ✅ ${c.prenom} ${c.nom} → id: ${data.createConducteur.id}`,
      );
      ids.push(data.createConducteur.id);
    }
  }
  return ids;
}

async function seedInterventions(vehicleIds) {
  console.log("\n🔧 Seeding interventions...");
  const interventions = [
    {
      type_intervention: "Vidange",
      date_planifiee: "2026-05-15",
      statut: "planifie",
      description: "Vidange huile moteur et filtre",
    },
    {
      type_intervention: "Révision générale",
      date_planifiee: "2026-05-20",
      statut: "planifie",
      description: "Révision complète 30 000 km",
    },
    {
      type_intervention: "Changement pneus",
      date_planifiee: "2026-04-10",
      statut: "termine",
      description: "Remplacement 4 pneus avant/arrière",
      date_realisation: "2026-04-10",
    },
    {
      type_intervention: "Freins",
      date_planifiee: "2026-06-01",
      statut: "planifie",
      description: "Remplacement plaquettes de frein",
    },
    {
      type_intervention: "Climatisation",
      date_planifiee: "2026-04-25",
      statut: "en_cours",
      description: "Recharge gaz climatisation",
    },
  ];

  for (let i = 0; i < interventions.length; i++) {
    const int = interventions[i];
    const vehicleId = vehicleIds[i % vehicleIds.length];
    const data = await gql(
      `
      mutation CreateIntervention($vehicule_id: String!, $type_intervention: String!, $date_planifiee: String!, $statut: String, $description: String, $date_realisation: String) {
        createIntervention(vehicule_id: $vehicule_id, type_intervention: $type_intervention, date_planifiee: $date_planifiee, statut: $statut, description: $description, date_realisation: $date_realisation) {
          id type_intervention statut
        }
      }
    `,
      { vehicule_id: vehicleId, ...int },
    );
    if (data?.createIntervention) {
      console.log(
        `  ✅ ${int.type_intervention} → id: ${data.createIntervention.id}`,
      );
    }
  }
}

async function main() {
  console.log("🌱 FleetManager Seed Script");
  console.log(`📡 Gateway: ${GATEWAY_URL}`);

  if (!TOKEN) {
    console.error("\n❌ TOKEN is required. Get one with:");
    console.error(
      `  export TOKEN=$(curl -s -X POST http://localhost:30080/realms/fleet-manager/protocol/openid-connect/token \\`,
    );
    console.error(
      `    -d "client_id=fleet-frontend&grant_type=password&username=younes-admin&password=YOUR_PASSWORD" \\`,
    );
    console.error(`    | jq -r .access_token)`);
    process.exit(1);
  }

  const vehicleIds = await seedVehicles();
  await seedConductors();
  await seedInterventions(vehicleIds);

  console.log("\n✅ Seeding complete!");
  console.log(
    "\n📋 Copy these vehicle IDs into gps-simulator.js VEHICLES array:",
  );
  vehicleIds
    .slice(0, 3)
    .forEach((id, i) => console.log(`  Vehicle ${i + 1}: ${id}`));
}

main().catch(console.error);

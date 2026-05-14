const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const PROTO_PATH = path.join(__dirname, "location.proto");

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const locationProto = grpc.loadPackageDefinition(packageDef).location;
const SERVICE_URL = process.env.LOCALIZATION_SERVICE_URL || "localhost:8000";

const VEHICLES = [
  {
    id: "1d20dfb5-2429-430f-8dc8-5cc4d941d08f",
    name: "AB-123",
    lat: 48.8566,
    lon: 2.3522,
  },
  {
    id: "7658cb81-4742-46e1-baca-a0c79a8dd4e4",
    name: "AA-123-BB",
    lat: 48.8566,
    lon: 2.3522,
  },
  {
    id: "aa685d1a-8fd0-487c-8791-d2a6f0306b7f",
    name: "CC-456-DD",
    lat: 43.2965,
    lon: 5.3698,
  },
  {
    id: "8a85b4da-eb92-4328-864d-f853311e0fb4",
    name: "EE-789-FF",
    lat: 45.764,
    lon: 4.8357,
  },
  {
    id: "04bf3127-4008-45da-bdba-94e6d47497a5",
    name: "GG-012-HH",
    lat: 43.6047,
    lon: 1.4442,
  },
  {
    id: "aace1d88-690b-4dce-832c-f809b5bbb961",
    name: "II-345-JJ",
    lat: 47.2184,
    lon: -1.5536,
  },
  {
    id: "a767446e-f7d0-4e25-9794-14159e32924c",
    name: "KK-678-LL",
    lat: 50.6292,
    lon: 3.0573,
  },
  {
    id: "24eaf9fe-fdc2-4425-a90b-8ff6f54ac2ae",
    name: "MM-901-NN",
    lat: 44.8378,
    lon: -0.5792,
  },
];

function randomDelta() {
  return (Math.random() - 0.5) * 0.01; // ~1km movement
}

function simulateVehicle(vehicle) {
  const client = new locationProto.LocationService(
    SERVICE_URL,
    grpc.credentials.createInsecure(),
  );

  const stream = client.StreamPositions((err, response) => {
    if (err) {
      console.error(`[${vehicle.name}] Stream error:`, err.message);
    } else {
      console.log(
        `[${vehicle.name}] Stream closed. Processed: ${response.processed_count}`,
      );
    }
  });

  let lat = vehicle.lat;
  let lon = vehicle.lon;
  let count = 0;
  const maxPositions = 10;

  const interval = setInterval(() => {
    if (count >= maxPositions) {
      clearInterval(interval);
      stream.end();
      return;
    }

    lat += randomDelta();
    lon += randomDelta();
    const speed = Math.random() * 120; // 0-120 km/h

    const position = {
      vehicle_id: vehicle.id,
      latitude: lat,
      longitude: lon,
      speed: speed,
      timestamp: Math.floor(Date.now() / 1000),
    };

    stream.write(position);
    console.log(
      `📍 [${vehicle.name}] lat=${lat.toFixed(4)}, lon=${lon.toFixed(4)}, speed=${speed.toFixed(1)}km/h`,
    );
    count++;
  }, 500);
}

async function main() {
  console.log(`GPS Simulator connecting to ${SERVICE_URL}`);
  console.log(`Simulating ${VEHICLES.length} vehicles, 10 positions each\n`);

  // Stagger vehicle starts
  VEHICLES.forEach((vehicle, i) => {
    setTimeout(() => simulateVehicle(vehicle), i * 200);
  });

  // Keep alive until all streams finish
  await new Promise((resolve) => setTimeout(resolve, 10000));
  console.log("\nSimulation complete");
}

main().catch(console.error);

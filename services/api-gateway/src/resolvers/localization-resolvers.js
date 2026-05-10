const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const PROTO_PATH = path.join(__dirname, "../location.proto");

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const locationProto = grpc.loadPackageDefinition(packageDef).location;

const LOCALIZATION_SERVICE_URL =
  process.env.LOCALIZATION_SERVICE_URL || "localization-service:8000";

function getClient() {
  return new locationProto.LocationService(
    LOCALIZATION_SERVICE_URL,
    grpc.credentials.createInsecure(),
  );
}

const localizationResolvers = {
  Query: {
    getLastLocation: async (_, { vehicleId }) => {
      return new Promise((resolve, reject) => {
        const client = getClient();
        client.GetLastKnownLocation(
          { vehicle_id: vehicleId },
          (err, response) => {
            if (err) {
              console.error("gRPC Error:", err.message);
              // Return null instead of throwing — vehicle may have no position yet
              return resolve(null);
            }
            resolve({
              latitude: response.latitude,
              longitude: response.longitude,
              speed: response.speed,
              timestamp: new Date(
                Number(response.timestamp) * 1000,
              ).toISOString(),
            });
          },
        );
      });
    },
  },

  // Resolve location field on Vehicule type automatically
  Vehicule: {
    location: async (vehicule) => {
      if (!vehicule.id) return null;
      return new Promise((resolve) => {
        const client = getClient();
        client.GetLastKnownLocation(
          { vehicle_id: vehicule.id },
          (err, response) => {
            if (err) return resolve(null);
            resolve({
              latitude: response.latitude,
              longitude: response.longitude,
              speed: response.speed,
              timestamp: new Date(
                Number(response.timestamp) * 1000,
              ).toISOString(),
            });
          },
        );
      });
    },
  },
};

module.exports = localizationResolvers;

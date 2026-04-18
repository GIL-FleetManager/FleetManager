const { ApolloServer, gql, AuthenticationError } = require("apollo-server");
const axios = require("axios");

const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

const client = jwksClient({
  jwksUri:
    "http://fleet-keycloak:8080/realms/fleet-manager/protocol/openid-connect/certs",
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err || !key) return callback(err || new Error("Key not found"));
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

const typeDefs = gql`
  type Vehicle {
    id: ID!
    model: String
    plateNumber: String
    location: GpsPoint
  }

  type GpsPoint {
    latitude: Float
    longitude: Float
    speed: Float
    timestamp: String
  }

  type Query {
    getVehicle(id: ID!): Vehicle
    health: String
  }
`;

const resolvers = {
  Query: {
    health: () => "OK",
    getVehicle: async (_, { id }, context) => {
      // Check if user has the right role in their JWT
      const roles = context.user.realm_access.roles;
      console.log("User Roles:", roles);
      if (!roles.includes("user") && !roles.includes("admin")) {
        throw new AuthenticationError("Insufficient permissions");
      }

      try {
        const res = await axios.get(
          `${process.env.VEHICLE_SERVICE_URL}/api/vehicles/${id}`,
        );
        const data = res.data;

        return {
          id: data.id,
          model: data.modele,
          plateNumber: data.immatriculation,
          statut: data.statut,
        };
      } catch (error) {
        console.error("Vehicle Service Error:", error.message);
        throw new Error("Vehicle service unreachable or data not found");
      }
    },
  },
  Vehicle: {
    location: async (parent, _, context) => {
      // Only for admins or managers
      const roles = context.user.realm_access.roles;
      if (!roles.includes("user") && !roles.includes("admin")) {
        throw new AuthenticationError("Insufficient permissions");
      }

      try {
        const res = await axios.get(
          `${process.env.LOCALIZATION_SERVICE_URL}/api/location/${parent.id}`,
        );
        return res.data;
      } catch (error) {
        console.error("Localization Service Error:", error.message);
        return null;
      }
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const token = req.headers.authorization || "";
    if (!token) throw new AuthenticationError("You must be logged in");

    return new Promise((resolve, reject) => {
      jwt.verify(token.replace("Bearer ", ""), getKey, {}, (err, decoded) => {
        if (err) return reject(new AuthenticationError("Invalid Token"));
        resolve({ user: decoded });
      });
    });
  },
});

server.listen({ port: 8000 }).then(({ url }) => {
  console.log(`API Gateway ready at ${url}`);
});

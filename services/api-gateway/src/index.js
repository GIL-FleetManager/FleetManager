const { ApolloServer, gql, AuthenticationError } = require("apollo-server");
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

// 1. Import your modular resolvers
const vehicleResolvers = require("./resolvers/vehicle-resolvers");

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || "http://fleet-keycloak:8080";

const client = jwksClient({
  jwksUri: `${KEYCLOAK_URL}/realms/fleet-manager/protocol/openid-connect/certs`,
  requestHeaders: {},
  timeout: 30000,
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
    plateNumber: String
    brand: String
    model: String
    status: String
    location: GpsPoint
  }

  type GpsPoint {
    latitude: Float
    longitude: Float
    speed: Float
    timestamp: String
  }

  type Query {
    vehicles: [Vehicle]
    getVehicle(id: ID!): Vehicle
    health: String
  }

  type Mutation {
    createVehicle(
      plateNumber: String!
      brand: String!
      model: String!
      status: String!
    ): Vehicle

    deleteVehicle(id: ID!): Boolean

    updateVehicle(
      id: ID!
      plateNumber: String
      brand: String
      model: String
      status: String
    ): Vehicle
  }
`;

const resolvers = {
  Query: {
    health: () => "OK",
    ...vehicleResolvers.Query,
  },
  Mutation: {
    ...vehicleResolvers.Mutation,
  },
  Vehicle: vehicleResolvers.Vehicle,
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    if (!token) throw new AuthenticationError("You must be logged in");

    return new Promise((resolve, reject) => {
      const options = {
        algorithms: ["RS256"],
        ignoreIssuer: true,
        ignoreAudience: true,
      };

      jwt.verify(token, getKey, options, (err, decoded) => {
        if (err) {
          console.error("DEBUG - JWT Error:", err.message);
          return reject(
            new AuthenticationError(`Invalid Token: ${err.message}`),
          );
        }
        resolve({ user: decoded });
      });
    });
  },
});

server.listen({ port: 8000 }).then(({ url }) => {
  console.log(`API Gateway ready at ${url}`);
});

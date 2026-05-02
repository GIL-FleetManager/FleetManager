const { ApolloServer, AuthenticationError } = require("apollo-server");
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const fs = require("node:fs");
const path = require("node:path");

const vehiculeResolvers = require("./resolvers/vehicle-resolvers");
const conducteurResolvers = require("./resolvers/conductor-resolvers");

const typeDefs = fs.readFileSync(
  path.join(__dirname, "schema.graphql"),
  "utf8",
);

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

const resolvers = {
  Query: {
    health: () => "OK",
    ...vehiculeResolvers.Query,
    ...conducteurResolvers.Query,
  },
  Mutation: {
    ...vehiculeResolvers.Mutation,
    ...conducteurResolvers.Mutation,
  },
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
        if (err)
          return reject(
            new AuthenticationError(`Invalid Token: ${err.message}`),
          );
        resolve({ user: decoded });
      });
    });
  },
});

server.listen({ port: 8000 }).then(({ url }) => {
  console.log(`API Gateway ready at ${url}`);
});

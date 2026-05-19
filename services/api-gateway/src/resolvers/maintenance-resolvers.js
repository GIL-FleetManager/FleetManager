const axios = require("axios");

const MAINTENANCE_URL =
  process.env.MAINTENANCE_SERVICE_URL || "http://maintenance-service:80";

const getAuthHeader = (context) => {
  if (context?.rawToken) return context.rawToken;
  if (context?.token) return context.token;
  if (context?.req?.headers?.authorization)
    return context.req.headers.authorization;
  if (context?.headers?.authorization) return context.headers.authorization;
  return "";
};

const maintenanceResolvers = {
  Query: {
    interventions: async (_, __, context) => {
      const res = await axios.get(`${MAINTENANCE_URL}/api/interventions`, {
        headers: { Authorization: getAuthHeader(context) },
      });
      return res.data;
    },
    intervention: async (_, { id }, context) => {
      const res = await axios.get(
        `${MAINTENANCE_URL}/api/interventions/${id}`,
        {
          headers: { Authorization: getAuthHeader(context) },
        },
      );
      return res.data;
    },
    techniciens: () => {
      return [
        {
          id: "PASTE-YOUNES-TECH-KEYCLOAK-UUID-HERE",
          nom: "Younes (Technicien)",
        },
      ];
    },
  },
  Mutation: {
    createIntervention: async (_, args, context) => {
      try {
        const res = await axios.post(
          `${MAINTENANCE_URL}/api/interventions`,
          args,
          {
            headers: { Authorization: getAuthHeader(context) },
          },
        );
        return res.data;
      } catch (error) {
        console.error(
          "Maintenance Backend Error:",
          error.response?.data || error.message,
        );
        throw new Error("Le backend de maintenance a refusé la requête.");
      }
    },
    updateIntervention: async (_, args, context) => {
      const { id, ...updates } = args;
      const res = await axios.put(
        `${MAINTENANCE_URL}/api/interventions/${id}`,
        updates,
        {
          headers: { Authorization: getAuthHeader(context) },
        },
      );
      return res.data;
    },
    deleteIntervention: async (_, { id }, context) => {
      await axios.delete(`${MAINTENANCE_URL}/api/interventions/${id}`, {
        headers: { Authorization: getAuthHeader(context) },
      });
      return true;
    },
  },
};

module.exports = maintenanceResolvers;

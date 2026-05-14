const axios = require("axios");

const MAINTENANCE_URL =
  process.env.MAINTENANCE_SERVICE_URL || "http://maintenance-service:80";

const maintenanceResolvers = {
  Query: {
    interventions: async () => {
      const res = await axios.get(`${MAINTENANCE_URL}/api/interventions`);
      return res.data;
    },
    intervention: async (_, { id }) => {
      const res = await axios.get(`${MAINTENANCE_URL}/api/interventions/${id}`);
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
    createIntervention: async (_, args) => {
      try {
        const res = await axios.post(
          `${MAINTENANCE_URL}/api/interventions`,
          args,
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
    updateIntervention: async (_, args) => {
      const { id, ...updates } = args;
      const res = await axios.put(
        `${MAINTENANCE_URL}/api/interventions/${id}`,
        updates,
      );
      return res.data;
    },
    deleteIntervention: async (_, { id }) => {
      await axios.delete(`${MAINTENANCE_URL}/api/interventions/${id}`);
      return true;
    },
  },
};

module.exports = maintenanceResolvers;

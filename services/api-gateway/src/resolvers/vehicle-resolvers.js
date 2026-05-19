const axios = require("axios");
const localizationResolvers = require("./localization-resolvers");

const getAuthHeader = (context) => {
  if (context?.rawToken) return context.rawToken;
  if (context?.token) return context.token;
  if (context?.req?.headers?.authorization)
    return context.req.headers.authorization;
  if (context?.headers?.authorization) return context.headers.authorization;
  return "";
};

const vehicleResolvers = {
  Query: {
    vehicules: async (_, __, context) => {
      try {
        const res = await axios.get(
          `${process.env.VEHICLE_SERVICE_URL}/api/vehicles`,
          {
            headers: { Authorization: getAuthHeader(context) },
          },
        );

        const rawData =
          res.data["hydra:member"] ||
          res.data.member ||
          (Array.isArray(res.data) ? res.data : []);

        return rawData.map((item) => {
          return {
            ...item,
            id: item.id || (item["@id"] ? item["@id"].split("/").pop() : null),
            marque: item.marque || "Inconnu",
            modele: item.modele || "Inconnu",
            statut: item.statut || "disponible",
          };
        });
      } catch (error) {
        console.error(
          "Vehicle Service Error:",
          error.response?.data || error.message,
        );
        throw new Error("Could not fetch vehicles list");
      }
    },
    getVehicule: async (_, { id }, context) => {
      try {
        const res = await axios.get(
          `${process.env.VEHICLE_SERVICE_URL}/api/vehicles/${id}`,
          {
            headers: { Authorization: getAuthHeader(context) },
          },
        );
        return res.data;
      } catch (error) {
        console.error(
          "Vehicle Service Error:",
          error.response?.data || error.message,
        );
        throw new Error("Vehicle service unreachable or data not found");
      }
    },
    getLastLocation: async (_, { vehicleId }) => {
      return localizationResolvers.Query.getLastLocation(null, { vehicleId });
    },
  },
  Vehicule: {
    statut: async (vehicule) => {
      try {
        const maintenance = await axios.get(
          `${process.env.MAINTENANCE_SERVICE_URL}/vehicule/${vehicule.id}/status`,
          { timeout: 1000 },
        );
        if (maintenance.data?.en_panne) return "en_panne";

        const mission = await axios.get(
          `${process.env.CONDUCTOR_SERVICE_URL}/vehicule/${vehicule.id}/assignment`,
          { timeout: 1000 },
        );
        console.log(
          `DEBUG: Statut assignation pour ${vehicule.id} ->`,
          mission.data,
        );
        if (mission.data?.assigne) return "en_mission";

        return vehicule.statut;
      } catch (error) {
        console.warn(`Fallback statut pour ${vehicule.id}:`, error.message);
        return vehicule.statut;
      }
    },
    location: async (vehicule) => {
      return await localizationResolvers.Vehicule.location(vehicule);
    },
  },
  Mutation: {
    createVehicule: async (_, args, context) => {
      try {
        const res = await axios({
          method: "post",
          url: `${process.env.VEHICLE_SERVICE_URL}/api/vehicles`,
          headers: {
            "Content-Type": "application/ld+json",
            Accept: "application/ld+json",
            Authorization: getAuthHeader(context),
          },
          data: args,
        });
        return res.data;
      } catch (error) {
        console.error(
          "Create Vehicle Error:",
          error.response?.data || error.message,
        );
        throw new Error("Could not create vehicle");
      }
    },
    updateVehicule: async (_, args, context) => {
      const { id, ...updates } = args;
      try {
        const res = await axios({
          method: "patch",
          url: `${process.env.VEHICLE_SERVICE_URL}/api/vehicles/${id}`,
          headers: {
            "Content-Type": "application/merge-patch+json",
            Accept: "application/ld+json",
            Authorization: getAuthHeader(context),
          },
          data: updates,
        });
        return res.data;
      } catch (error) {
        console.error(
          "Update Vehicle Error:",
          error.response?.data || error.message,
        );
        throw new Error("Could not update vehicle");
      }
    },
    deleteVehicule: async (_, { id }, context) => {
      try {
        await axios({
          method: "delete",
          url: `${process.env.VEHICLE_SERVICE_URL}/api/vehicles/${id}`,
          headers: { Authorization: getAuthHeader(context) },
        });
        return true;
      } catch (error) {
        console.error(
          "Delete Vehicle Error:",
          error.response?.data || error.message,
        );
        throw new Error("Could not delete vehicle");
      }
    },
  },
};

module.exports = vehicleResolvers;

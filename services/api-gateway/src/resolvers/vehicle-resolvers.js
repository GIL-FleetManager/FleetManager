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
        return res.data.member || res.data["hydra:member"] || res.data;
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
    location: async (parent) => {
      try {
        return await localizationResolvers.Query.getLastLocation(null, {
          vehicleId: parent.id,
        });
      } catch (error) {
        console.error("Erreur récupération location:", error);
        return null;
      }
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

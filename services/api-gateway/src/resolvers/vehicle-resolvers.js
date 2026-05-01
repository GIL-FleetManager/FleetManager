const axios = require("axios");
const { AuthenticationError } = require("apollo-server");

const vehicleResolvers = {
  Query: {
    vehicles: async (_, __, context) => {
      try {
        const res = await axios.get(
          `${process.env.VEHICLE_SERVICE_URL}/api/vehicles`,
        );
        const items = res.data.member || res.data["hydra:member"] || res.data;

        return items.map((v) => ({
          id: v.id,
          plateNumber: v.immatriculation,
          brand: v.marque,
          model: v.modele,
          status: v.statut,
        }));
      } catch (error) {
        console.error("Vehicle Service Error:", error.message);
        throw new Error("Could not fetch vehicles list");
      }
    },
    getVehicle: async (_, { id }, context) => {
      const roles = context.user.realm_access.roles;
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
          plateNumber: data.immatriculation,
          brand: data.marque,
          model: data.modele,
          status: data.statut,
        };
      } catch (error) {
        console.error("Vehicle Service Error:", error.message);
        throw new Error("Vehicle service unreachable or data not found");
      }
    },
  },
  Mutation: {
    createVehicle: async (_, args, context) => {
      try {
        const res = await axios({
          method: "post",
          url: `${process.env.VEHICLE_SERVICE_URL}/api/vehicles`,
          headers: {
            "Content-Type": "application/ld+json",
            Accept: "application/ld+json",
          },
          data: {
            immatriculation: args.plateNumber,
            marque: args.brand,
            modele: args.model,
            statut: args.status,
          },
        });

        return {
          id: res.data.id,
          plateNumber: res.data.immatriculation,
          brand: res.data.marque,
          model: res.data.modele,
          status: res.data.statut,
        };
      } catch (error) {
        console.error(
          "Create Vehicle Error:",
          error.response ? error.response.data : error.message,
        );
        throw new Error("Could not create vehicle");
      }
    },
    updateVehicle: async (_, args, context) => {
      const { id, ...updates } = args;

      const payload = {};
      if (updates.plateNumber !== undefined)
        payload.immatriculation = updates.plateNumber;
      if (updates.brand !== undefined) payload.marque = updates.brand;
      if (updates.model !== undefined) payload.modele = updates.model;
      if (updates.status !== undefined) payload.statut = updates.status;

      try {
        const res = await axios({
          method: "patch",
          url: `${process.env.VEHICLE_SERVICE_URL}/api/vehicles/${id}`,
          headers: {
            "Content-Type": "application/merge-patch+json", 
            Accept: "application/ld+json",
          },
          data: payload,
        });

        return {
          id: res.data.id,
          plateNumber: res.data.immatriculation,
          brand: res.data.marque,
          model: res.data.modele,
          status: res.data.statut,
        };
      } catch (error) {
        console.error(
          "Update Vehicle Error:",
          error.response ? error.response.data : error.message,
        );
        throw new Error("Could not update vehicle");
      }
    },

    deleteVehicle: async (_, { id }, context) => {
      try {
        await axios({
          method: "delete",
          url: `${process.env.VEHICLE_SERVICE_URL}/api/vehicles/${id}`,
        });
        return true; 
      } catch (error) {
        console.error(
          "Delete Vehicle Error:",
          error.response ? error.response.data : error.message,
        );
        throw new Error("Could not delete vehicle");
      }
    },
  },
  Vehicle: {
    location: async (parent, _, context) => {
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

module.exports = vehicleResolvers;

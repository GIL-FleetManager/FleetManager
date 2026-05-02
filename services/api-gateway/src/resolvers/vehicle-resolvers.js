const axios = require("axios");

const vehicleResolvers = {
  Query: {
    vehicules: async () => {
      try {
        const res = await axios.get(
          `${process.env.VEHICLE_SERVICE_URL}/api/vehicles`,
        );
        return res.data.member || res.data["hydra:member"] || res.data;
      } catch (error) {
        console.error("Vehicle Service Error:", error.message);
        throw new Error("Could not fetch vehicles list");
      }
    },
    getVehicule: async (_, { id }) => {
      try {
        const res = await axios.get(
          `${process.env.VEHICLE_SERVICE_URL}/api/vehicles/${id}`,
        );
        return res.data;
      } catch (error) {
        console.error("Vehicle Service Error:", error.message);
        throw new Error("Vehicle service unreachable or data not found");
      }
    },
  },
  Mutation: {
    createVehicule: async (_, args) => {
      try {
        const res = await axios({
          method: "post",
          url: `${process.env.VEHICLE_SERVICE_URL}/api/vehicles`,
          headers: {
            "Content-Type": "application/ld+json",
            Accept: "application/ld+json",
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
    updateVehicule: async (_, args) => {
      const { id, ...updates } = args;
      try {
        const res = await axios({
          method: "patch",
          url: `${process.env.VEHICLE_SERVICE_URL}/api/vehicles/${id}`,
          headers: {
            "Content-Type": "application/merge-patch+json",
            Accept: "application/ld+json",
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
    deleteVehicule: async (_, { id }) => {
      try {
        await axios({
          method: "delete",
          url: `${process.env.VEHICLE_SERVICE_URL}/api/vehicles/${id}`,
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

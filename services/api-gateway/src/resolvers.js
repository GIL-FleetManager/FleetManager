const axios = require("axios");

const resolvers = {
  Query: {
    getVehicle: async (_, { id }) => {
      const res = await axios.get(
        `http://fleet-vehicle-service/api/vehicles/${id}`,
      );
      return res.data;
    },
  },
  Vehicle: {
    location: async (parent) => {
      const res = await axios.get(
        `http://fleet-localization-service/api/location/${parent.id}`,
      );
      return res.data;
    },
  },
};

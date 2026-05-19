const axios = require("axios");

const CONDUCTOR_API = `${process.env.CONDUCTOR_SERVICE_URL}/api/conductors`;

const getAuthHeader = (context) => {
  if (context?.rawToken) return context.rawToken;
  if (context?.token) return context.token;
  if (context?.req?.headers?.authorization)
    return context.req.headers.authorization;
  if (context?.headers?.authorization) return context.headers.authorization;
  return "";
};

const conducteurResolvers = {
  Query: {
    conducteurs: async (_, __, context) => {
      try {
        const res = await axios.get(CONDUCTOR_API, {
          headers: { Authorization: getAuthHeader(context) },
        });

        const data = res.data["hydra:member"] || res.data.member || res.data;

        return data.map((d) => {
          return {
            id: d.id,
            nom: d.nom,
            prenom: d.prenom,
            email: d.email,
            telephone: d.telephone,
            numero_permis: d.numero_permis,
            date_expiration_permis: d.date_expiration_permis,
            statut: d.statut,
          };
        });
      } catch (error) {
        console.error("Conducteur Service Error:", error.message);
        throw new Error("Could not fetch conducteurs list");
      }
    },
    getConducteur: async (_, { id }, context) => {
      try {
        const res = await axios.get(`${CONDUCTOR_API}/${id}`, {
          headers: { Authorization: getAuthHeader(context) },
        });
        const d = res.data;
        return {
          ...d,
          numero_permis: d.numero_permis,
          date_expiration_permis: d.date_expiration_permis,
        };
      } catch (error) {
        console.error("Conducteur Service Error:", error.message);
        throw new Error("Conducteur not found");
      }
    },
  },
  Mutation: {
    createConducteur: async (_, args, context) => {
      try {
        const res = await axios({
          method: "post",
          url: CONDUCTOR_API,
          headers: {
            "Content-Type": "application/ld+json",
            Accept: "application/ld+json",
            Authorization: getAuthHeader(context),
          },
          data: args,
        });

        const id = res.data.id;
        const full = await axios({
          method: "get",
          url: `${CONDUCTOR_API}/${id}`,
          headers: {
            Accept: "application/ld+json",
            Authorization: getAuthHeader(context),
          },
        });

        return {
          id: full.data.id,
          nom: full.data.nom,
          prenom: full.data.prenom,
          email: full.data.email,
          telephone: full.data.telephone,
          numero_permis: full.data.numero_permis || full.data.numeroPermis,
          date_expiration_permis:
            full.data.date_expiration_permis || full.data.dateExpirationPermis,
          statut: full.data.statut || "actif",
        };
      } catch (error) {
        console.error(
          "[CREATE] Erreur Symfony :",
          error.response?.data || error.message,
        );
        throw new Error(
          error.response?.data?.["hydra:description"] ||
            "Erreur lors de la création du conducteur",
        );
      }
    },
    updateConducteur: async (_, args, context) => {
      const { id, ...payload } = args;
      try {
        const res = await axios({
          method: "patch",
          url: `${CONDUCTOR_API}/${id}`,
          headers: {
            "Content-Type": "application/merge-patch+json",
            Accept: "application/ld+json",
            Authorization: getAuthHeader(context),
          },
          data: payload,
        });
        const d = res.data;
        return {
          id: d.id,
          nom: d.nom,
          prenom: d.prenom,
          email: d.email,
          telephone: d.telephone,
          numero_permis: d.numero_permis,
          date_expiration_permis: d.date_expiration_permis,
          statut: d.statut,
        };
      } catch (error) {
        console.error(
          "Update Conducteur Error:",
          error.response?.data || error.message,
        );
        throw new Error("Could not update conducteur");
      }
    },
    deleteConducteur: async (_, { id }, context) => {
      try {
        await axios({
          method: "delete",
          url: `${CONDUCTOR_API}/${id}`,
          headers: { Authorization: getAuthHeader(context) },
        });
        return true;
      } catch (error) {
        console.error(
          "Delete Conducteur Error:",
          error.response?.data || error.message,
        );
        throw new Error("Could not delete conducteur");
      }
    },
    assignVehicleToConductor: async (
      _,
      { conductor_id, vehicle_id, unassign_previous },
      context,
    ) => {
      try {
        const token =
          context.req?.headers?.authorization || context.token || "";

        const res = await axios({
          method: "post",
          url: `${CONDUCTOR_API}/${conductor_id}/assign-vehicle`,
          data: {
            vehicle_id,
            unassign_previous: unassign_previous ?? true,
          },
          headers: {
            Authorization: getAuthHeader(context),
            "Content-Type": "application/json",
            Accept: "application/ld+json",
          },
        });
        const d = res.data;
        return {
          id: d.id,
          conductor_id: d.conductor_id,
          vehicle_id: d.vehicle_id,
          assigned_at: d.assigned_at,
          unassigned_at: d.unassigned_at,
          status: d.status,
          created_at: d.created_at,
        };
      } catch (error) {
        console.error(
          "Assign Vehicle Error:",
          error.response?.data || error.message,
        );
        throw new Error(
          error.response?.data?.error ||
            "Could not assign vehicle to conductor",
        );
      }
    },
    unassignVehicleFromConductor: async (_, { assignment_id }, context) => {
      try {
        const res = await axios({
          method: "post",
          url: `${CONDUCTOR_API}/assignments/${assignment_id}/unassign`,
          headers: {
            Authorization: getAuthHeader(context),
            "Content-Type": "application/json",
            Accept: "application/ld+json",
          },
        });
        const d = res.data;
        return {
          id: d.id,
          conductor_id: d.conductor_id,
          vehicle_id: d.vehicle_id,
          assigned_at: d.assigned_at,
          unassigned_at: d.unassigned_at,
          status: d.status,
          created_at: d.created_at,
        };
      } catch (error) {
        console.error(
          "Unassign Vehicle Error:",
          error.response?.data || error.message,
        );
        throw new Error("Could not unassign vehicle");
      }
    },
  },
};

module.exports = conducteurResolvers;

const axios = require("axios");

const CONDUCTOR_API = `${process.env.CONDUCTOR_SERVICE_URL}/api/conductors`;

const conducteurResolvers = {
  Query: {
    conducteurs: async () => {
      try {
        console.log(
          "🔍 [ENV] CONDUCTOR_SERVICE_URL:",
          process.env.CONDUCTOR_SERVICE_URL,
        );
        console.log("🔍 [ENV] CONDUCTOR_API:", CONDUCTOR_API);

        const res = await axios.get(CONDUCTOR_API);
        console.log("✅ [GET] Status:", res.status);
        console.log(
          "✅ [GET] Raw response:",
          JSON.stringify(res.data, null, 2),
        );

        const data = res.data["hydra:member"] || res.data.member || res.data;

        console.log(
          "✅ [GET] First item raw:",
          JSON.stringify(data[0], null, 2),
        );

        return data.map((d) => {
          console.log("🗂️ [MAP] item keys:", Object.keys(d));
          console.log("🗂️ [MAP] item:", JSON.stringify(d, null, 2));
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
    getConducteur: async (_, { id }) => {
      try {
        const res = await axios.get(`${CONDUCTOR_API}/${id}`);
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
    createConducteur: async (_, args) => {
      console.log("🚀 [CREATE] Variables envoyées à Symfony :", args);
      try {
        const res = await axios({
          method: "post",
          url: CONDUCTOR_API,
          headers: {
            "Content-Type": "application/ld+json",
            Accept: "application/ld+json",
          },
          data: args,
        });

        console.log("✅ [CREATE] Réponse brute de Symfony :", res.data);

        const id = res.data.id;
        const full = await axios({
          method: "get",
          url: `${CONDUCTOR_API}/${id}`,
          headers: { Accept: "application/ld+json" },
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
          "❌ [CREATE] Erreur Symfony :",
          error.response?.data || error.message,
        );
        throw new Error(
          error.response?.data?.["hydra:description"] ||
            "Erreur lors de la création du conducteur",
        );
      }
    },
    updateConducteur: async (_, args) => {
      const { id, ...payload } = args;
      try {
        const res = await axios({
          method: "patch",
          url: `${CONDUCTOR_API}/${id}`,
          headers: {
            "Content-Type": "application/merge-patch+json",
            Accept: "application/ld+json",
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
    deleteConducteur: async (_, { id }) => {
      try {
        await axios({
          method: "delete",
          url: `${CONDUCTOR_API}/${id}`,
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
  },
};

module.exports = conducteurResolvers;

import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Intervention {
  id: string;
  vehicule_id: string;
  technicien_id?: string | null;
  type_intervention: string;
  statut: string;
  date_planifiee: string;
}

export interface Technicien {
  id: string;
  keycloakId: string;
  nom: string;
  prenom: string;
  specialite?: string | null;
  disponible: boolean;
}

export interface Vehicule {
  id: string;
  immatriculation: string;
  marque: string;
  modele: string;
}

const GET_INTERVENTIONS = gql`
  query GetInterventions {
    interventions {
      id
      vehicule_id
      technicien_id
      type_intervention
      statut
      date_planifiee
    }
  }
`;

const GET_VEHICLES = gql`
  query GetVehicules {
    vehicules {
      id
      immatriculation
      marque
      modele
    }
  }
`;

const GET_TECHNICIENS = gql`
  query GetTechniciens {
    techniciens {
      id
      keycloakId
      nom
      prenom
      specialite
      disponible
    }
  }
`;

const CREATE_INTERVENTION = gql`
  mutation CreateIntervention(
    $vehiculeId: String!
    $technicienId: String
    $typeIntervention: String!
    $datePlanifiee: String!
    $statut: String
  ) {
    createIntervention(
      vehicule_id: $vehiculeId
      technicien_id: $technicienId
      type_intervention: $typeIntervention
      date_planifiee: $datePlanifiee
      statut: $statut
    ) {
      id
      vehicule_id
      technicien_id
      type_intervention
      statut
      date_planifiee
    }
  }
`;

const UPDATE_INTERVENTION = gql`
  mutation UpdateIntervention(
    $id: ID!
    $vehiculeId: String
    $technicienId: String
    $typeIntervention: String
    $datePlanifiee: String
    $statut: String
  ) {
    updateIntervention(
      id: $id
      vehicule_id: $vehiculeId
      technicien_id: $technicienId
      type_intervention: $typeIntervention
      date_planifiee: $datePlanifiee
      statut: $statut
    ) {
      id
      vehicule_id
      technicien_id
      type_intervention
      statut
      date_planifiee
    }
  }
`;

const DELETE_INTERVENTION = gql`
  mutation DeleteIntervention($id: ID!) {
    deleteIntervention(id: $id)
  }
`;

@Injectable({
  providedIn: 'root',
})
export class ServiceMaintenance {
  constructor(private readonly apollo: Apollo) {}

  getVehicules(): Observable<Vehicule[]> {
    return this.apollo
      .watchQuery<{ vehicules: Vehicule[] }>({
        query: GET_VEHICLES,
        fetchPolicy: 'cache-first',
      })
      .valueChanges.pipe(
        map((result) =>
          (result.data?.vehicules ?? []).map((v) => ({
            id: v.id ?? '',
            immatriculation: v.immatriculation ?? '',
            marque: v.marque ?? '',
            modele: v.modele ?? '',
          })),
        ),
      );
  }

  getInterventions(): Observable<Intervention[]> {
    return this.apollo
      .watchQuery<{ interventions: Intervention[] }>({
        query: GET_INTERVENTIONS,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(
        map((result) =>
          (result.data?.interventions ?? []).map((i) => ({
            id: i.id ?? '',
            vehicule_id: i.vehicule_id ?? '',
            technicien_id: i.technicien_id ?? null,
            type_intervention: i.type_intervention ?? '',
            statut: i.statut ?? '',
            date_planifiee: i.date_planifiee ?? '',
          })),
        ),
      );
  }

  getTechniciens(): Observable<Technicien[]> {
    return this.apollo
      .watchQuery<{ techniciens: Technicien[] }>({
        query: GET_TECHNICIENS,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(
        map((result) =>
          (result.data?.techniciens ?? []).map((t) => ({
            id: t.id ?? '',
            keycloakId: t.keycloakId ?? '',
            nom: t.nom ?? '',
            prenom: t.prenom ?? '',
            specialite: t.specialite ?? null,
            disponible: t.disponible ?? true,
          })),
        ),
      );
  }

  createIntervention(
    vehiculeId: string,
    technicienId: string | null,
    typeIntervention: string,
    datePlanifiee: string,
    statut: string = 'planifie',
  ): Observable<Intervention> {
    return this.apollo
      .mutate<{ createIntervention: Intervention }>({
        mutation: CREATE_INTERVENTION,
        variables: { vehiculeId, technicienId, typeIntervention, datePlanifiee, statut },
      })
      .pipe(
        map((result) => {
          const i = result.data!.createIntervention;
          return {
            id: i.id ?? '',
            vehicule_id: i.vehicule_id ?? '',
            technicien_id: i.technicien_id ?? null,
            type_intervention: i.type_intervention ?? '',
            statut: i.statut ?? '',
            date_planifiee: i.date_planifiee ?? '',
          };
        }),
      );
  }

  updateIntervention(
    id: string,
    vehiculeId: string,
    technicienId: string | null,
    typeIntervention: string,
    datePlanifiee: string,
    statut: string,
  ): Observable<Intervention> {
    return this.apollo
      .mutate<{ updateIntervention: Intervention }>({
        mutation: UPDATE_INTERVENTION,
        variables: { id, vehiculeId, technicienId, typeIntervention, datePlanifiee, statut },
      })
      .pipe(
        map((result) => {
          const i = result.data!.updateIntervention;
          return {
            id: i.id ?? '',
            vehicule_id: i.vehicule_id ?? '',
            technicien_id: i.technicien_id ?? null,
            type_intervention: i.type_intervention ?? '',
            statut: i.statut ?? '',
            date_planifiee: i.date_planifiee ?? '',
          };
        }),
      );
  }

  deleteIntervention(id: string): Observable<boolean> {
    return this.apollo
      .mutate<{ deleteIntervention: boolean }>({
        mutation: DELETE_INTERVENTION,
        variables: { id },
      })
      .pipe(map((result) => result.data!.deleteIntervention ?? false));
  }
}

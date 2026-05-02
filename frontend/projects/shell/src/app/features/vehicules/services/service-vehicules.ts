import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable, map } from 'rxjs';

export interface Vehicule {
  id?: string;
  immatriculation: string;
  marque: string;
  modele: string;
  statut: 'disponible' | 'en_mission' | 'en_panne' | 'en_maintenance';
}

@Injectable({ providedIn: 'root' })
export class ServiceVehicules {
  private readonly apollo = inject(Apollo);

  // --- QUERIES ---
  /**
   * Récupère tous les véhicules via la Gateway
   */
  getAll(): Observable<Vehicule[]> {
    return this.apollo
      .watchQuery<{ vehicules: Partial<Vehicule>[] }>({
        query: gql`
          query GetVehicules {
            vehicules {
              id
              immatriculation
              marque
              modele
              statut
            }
          }
        `,
      })
      .valueChanges.pipe(
        map((res) =>
          (res.data?.vehicules ?? []).filter(
            (v): v is Vehicule =>
              typeof v.id === 'string' &&
              typeof v.immatriculation === 'string' &&
              typeof v.marque === 'string' &&
              typeof v.modele === 'string' &&
              typeof v.statut === 'string',
          ),
        ),
      );
  }

  /**
   * Récupère un véhicule spécifique par son ID
   */
  getOne(id: string): Observable<Vehicule | null> {
    return this.apollo
      .query<{ getVehicule: Vehicule }>({
        query: gql`
          query GetVehicule($id: ID!) {
            getVehicule(id: $id) {
              id
              immatriculation
              marque
              modele
              statut
            }
          }
        `,
        variables: { id },
      })
      .pipe(map((res) => res.data?.getVehicule ?? null));
  }

  // --- MUTATIONS ---

  /**
   * Crée un nouveau véhicule
   */
  create(vehicule: Omit<Vehicule, 'id'>): Observable<Vehicule> {
    return this.apollo
      .mutate<{ createVehicule: Vehicule }>({
        mutation: gql`
          mutation CreateVehicule(
            $immatriculation: String!
            $marque: String!
            $modele: String!
            $statut: String!
          ) {
            createVehicule(
              immatriculation: $immatriculation
              marque: $marque
              modele: $modele
              statut: $statut
            ) {
              id
              immatriculation
              marque
              modele
              statut
            }
          }
        `,
        variables: { ...vehicule },
      })
      .pipe(
        map((res) => {
          if (!res.data?.createVehicule) {
            throw new Error('Échec de la création du véhicule');
          }
          return res.data.createVehicule;
        }),
      );
  }

  /**
   * Met à jour un véhicule existant
   */
  update(id: string, vehicule: Partial<Vehicule>): Observable<Vehicule> {
    return this.apollo
      .mutate<{ updateVehicule: Vehicule }>({
        mutation: gql`
          mutation UpdateVehicule(
            $id: ID!
            $immatriculation: String
            $marque: String
            $modele: String
            $statut: String
          ) {
            updateVehicule(
              id: $id
              immatriculation: $immatriculation
              marque: $marque
              modele: $modele
              statut: $statut
            ) {
              id
              statut
            }
          }
        `,
        variables: { id, ...vehicule },
      })
      .pipe(
        map((res) => {
          if (!res.data?.updateVehicule) {
            throw new Error('Échec de la mise à jour du véhicule');
          }
          return res.data.updateVehicule;
        }),
      );
  }

  /**
   * Supprime un véhicule
   */
  delete(id: string): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation DeleteVehicule($id: ID!) {
          deleteVehicule(id: $id)
        }
      `,
      variables: { id },
    });
  }
}

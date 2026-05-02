import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable, map } from 'rxjs';

export interface Conducteur {
  id?: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  numero_permis: string;
  date_expiration_permis: string;
  statut: string;
}

@Injectable({ providedIn: 'root' })
export class ConducteursService {
  private readonly apollo = inject(Apollo);

  // --- QUERIES ---

  /**
   * Récupère tous les conducteurs via la Gateway
   */
  getAll(): Observable<Conducteur[]> {
    return this.apollo
      .watchQuery<{ conducteurs: Conducteur[] }>({
        query: gql`
          query GetConducteurs {
            conducteurs {
              id
              nom
              prenom
              email
              telephone
              numero_permis
              date_expiration_permis
              statut
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((res) => (res.data?.conducteurs as Conducteur[]) ?? []));
  }

  /**
   * Récupère un conducteur spécifique par son ID
   */
  getById(id: string): Observable<Conducteur | null> {
    return this.apollo
      .query<{ getConducteur: Conducteur }>({
        query: gql`
          query GetConducteur($id: ID!) {
            getConducteur(id: $id) {
              id
              nom
              prenom
              email
              telephone
              numero_permis
              date_expiration_permis
              statut
            }
          }
        `,
        variables: { id },
      })
      .pipe(map((res) => res.data?.getConducteur ?? null));
  }

  // --- MUTATIONS ---

  /**
   * Crée un nouveau conducteur
   */
  create(conducteur: Omit<Conducteur, 'id'>): Observable<Conducteur> {
    return this.apollo
      .mutate<{ createConducteur: Conducteur }>({
        mutation: gql`
          mutation CreateConducteur(
            $nom: String!
            $prenom: String!
            $email: String!
            $telephone: String
            $numero_permis: String!
            $date_expiration_permis: String!
            $statut: String
          ) {
            createConducteur(
              nom: $nom
              prenom: $prenom
              email: $email
              telephone: $telephone
              numero_permis: $numero_permis
              date_expiration_permis: $date_expiration_permis
              statut: $statut
            ) {
              id
              nom
              prenom
              statut
            }
          }
        `,
        variables: { ...conducteur },
      })
      .pipe(
        map((res) => {
          if (!res.data?.createConducteur) {
            throw new Error('Échec de la création du conducteur');
          }
          return res.data.createConducteur;
        }),
      );
  }

  /**
   * Met à jour un conducteur existant
   */
  update(id: string, conducteur: Partial<Conducteur>): Observable<Conducteur> {
    return this.apollo
      .mutate<{ updateConducteur: Conducteur }>({
        mutation: gql`
          mutation UpdateConducteur(
            $id: ID!
            $nom: String
            $prenom: String
            $email: String
            $telephone: String
            $numero_permis: String
            $date_expiration_permis: String
            $statut: String
          ) {
            updateConducteur(
              id: $id
              nom: $nom
              prenom: $prenom
              email: $email
              telephone: $telephone
              numero_permis: $numero_permis
              date_expiration_permis: $date_expiration_permis
              statut: $statut
            ) {
              id
              nom
              prenom
              statut
            }
          }
        `,
        variables: { id, ...conducteur },
      })
      .pipe(
        map((res) => {
          if (!res.data?.updateConducteur) {
            throw new Error('Échec de la mise à jour du conducteur');
          }
          return res.data.updateConducteur;
        }),
      );
  }

  /**
   * Supprime un conducteur
   */
  delete(id: string): Observable<boolean> {
    return this.apollo
      .mutate<{ deleteConducteur: boolean }>({
        mutation: gql`
          mutation DeleteConducteur($id: ID!) {
            deleteConducteur(id: $id)
          }
        `,
        variables: { id },
      })
      .pipe(map((res) => res.data?.deleteConducteur ?? false));
  }
}

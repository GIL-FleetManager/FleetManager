import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable, map } from 'rxjs';

export interface Vehicle {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  status: 'available' | 'in_mission' | 'broken' | 'maintenance'; // statut -> status
}

@Injectable({ providedIn: 'root' })
export class ServiceVehicules {
  private readonly apollo = inject(Apollo);

  // --- QUERIES ---
  /**
   * Récupère tous les véhicules via le Gateway
   */
  getAll(): Observable<Vehicle[]> {
    return this.apollo
      .watchQuery<{ vehicles: Partial<Vehicle>[] }>({
        query: gql`
          query GetVehicles {
            vehicles {
              id
              plateNumber
              brand
              model
              status
            }
          }
        `,
      })
      .valueChanges.pipe(
        map((res) =>
          (res.data?.vehicles ?? []).filter(
            (v): v is Vehicle =>
              typeof v.id === 'string' &&
              typeof v.plateNumber === 'string' &&
              typeof v.brand === 'string' &&
              typeof v.model === 'string' &&
              typeof v.status === 'string',
          ),
        ),
      );
  }

  /**
   * Récupère un véhicule spécifique par son ID
   */
  getOne(id: string): Observable<Vehicle | null> {
    return this.apollo
      .query<{ vehicle: Vehicle }>({
        query: gql`
          query GetVehicle($id: ID!) {
            vehicle(id: $id) {
              id
              plateNumber
              brand
              model
              status
            }
          }
        `,
        variables: { id },
      })
      .pipe(map((res) => res.data?.vehicle ?? null));
  }

  // --- MUTATIONS ---

  /**
   * Crée un nouveau véhicule
   */
  create(vehicle: Omit<Vehicle, 'id'>): Observable<Vehicle> {
    return this.apollo
      .mutate<{ createVehicle: Vehicle }>({
        mutation: gql`
          mutation CreateVehicle(
            $plateNumber: String!
            $brand: String!
            $model: String!
            $status: String!
          ) {
            createVehicle(
              plateNumber: $plateNumber
              brand: $brand
              model: $model
              status: $status
            ) {
              id
              plateNumber
              brand
              model
              status
            }
          }
        `,
        variables: { ...vehicle },
      })
      .pipe(
        map((res) => {
          if (!res.data?.createVehicle) {
            throw new Error('Vehicle creation failed');
          }
          return res.data.createVehicle;
        }),
      );
  }

  /**
   * Met à jour un véhicule existant
   */
  update(id: string, vehicle: Partial<Vehicle>): Observable<Vehicle> {
    return this.apollo
      .mutate<{ updateVehicle: Vehicle }>({
        mutation: gql`
          mutation UpdateVehicle(
            $id: ID!
            $plateNumber: String
            $brand: String
            $model: String
            $status: String
          ) {
            updateVehicle(
              id: $id
              plateNumber: $plateNumber
              brand: $brand
              model: $model
              status: $status
            ) {
              id
              status
            }
          }
        `,
        variables: { id, ...vehicle },
      })
      .pipe(
        map((res) => {
          if (!res.data?.updateVehicle) {
            throw new Error('Vehicle update failed');
          }
          return res.data.updateVehicle;
        }),
      );
  }

  /**
   * Supprime un véhicule
   */
  delete(id: string): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation DeleteVehicle($id: ID!) {
          deleteVehicle(id: $id)
        }
      `,
      variables: { id },
    });
  }
}

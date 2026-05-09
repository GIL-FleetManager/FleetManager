import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Intervention {
  id: string;
  vehicule_id: string;
  type_intervention: string;
  statut: string;
  date_planifiee: string;
}

const GET_INTERVENTIONS = gql`
  query GetInterventions {
    interventions {
      id
      vehicule_id
      type_intervention
      statut
      date_planifiee
    }
  }
`;

const CREATE_INTERVENTION = gql`
  mutation CreateIntervention(
    $vehiculeId: String!
    $typeIntervention: String!
    $datePlanifiee: String!
  ) {
    createIntervention(
      vehicule_id: $vehiculeId
      type_intervention: $typeIntervention
      date_planifiee: $datePlanifiee
    ) {
      id
      type_intervention
      statut
      date_planifiee
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class ServiceMaintenance {
  constructor(private readonly apollo: Apollo) {}

  // Fetch all interventions
  getInterventions(): Observable<Intervention[]> {
    return this.apollo
      .watchQuery<{ interventions: any[] }>({
        query: GET_INTERVENTIONS,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(
        map((result) =>
          (result.data?.interventions ?? []).map((item) => ({
            id: item.id ?? '',
            vehicule_id: item.vehicule_id ?? '',
            type_intervention: item.type_intervention ?? '',
            statut: item.statut ?? '',
            date_planifiee: item.date_planifiee ?? '',
          })),
        ),
      );
  }

  // Create a new intervention
  createIntervention(
    vehiculeId: string,
    typeIntervention: string,
    datePlanifiee: string,
  ): Observable<Intervention> {
    return this.apollo
      .mutate<{ createIntervention: Intervention }>({
        mutation: CREATE_INTERVENTION,
        variables: {
          vehiculeId,
          typeIntervention,
          datePlanifiee,
        },
      })
      .pipe(map((result) => result.data!.createIntervention));
  }
}

import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environements/environment';
import { Apollo, gql } from 'apollo-angular';
import { forkJoin, catchError, of, map } from 'rxjs';

interface KpiCard {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  trend?: string;
  link?: string;
}

// 1. Interfaces mises à jour en français
interface Vehicule {
  id: string;
  immatriculation: string;
  marque: string;
  modele: string;
  statut: string;
}

interface Conducteur {
  id: string;
  nom: string;
  prenom: string;
  statut?: string;
}

interface Intervention {
  id: string;
  type_intervention: string;
  statut: string;
  date_debut: string;
  vehicule_id?: string;
}

@Component({
  selector: 'app-admin-widgets',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-widgets.component.html',
  styleUrl: './admin-widgets.component.scss',
})
export class AdminWidgetsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apollo = inject(Apollo);

  isLoading = signal(true);
  kpis = signal<KpiCard[]>([]);

  // Utilisation des nouveaux types
  recentVehicles = signal<Vehicule[]>([]);
  recentInterventions = signal<Intervention[]>([]);
  alerts = signal<any[]>([]);

  ngOnInit(): void {
    // 2. Requête GraphQL groupée pour Véhicules et Conducteurs
    const graphql$ = this.apollo
      .query<{ vehicules: Vehicule[]; conducteurs: Conducteur[] }>({
        query: gql`
          query GetDashboardData {
            vehicules {
              id
              immatriculation
              marque
              modele
              statut
            }
            conducteurs {
              id
              nom
              prenom
              statut
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((res) => res.data),
        catchError((err) => {
          console.error('Erreur GraphQL Dashboard:', err);
          return of({ vehicules: [], conducteurs: [] });
        }),
      );

    // 3. Requêtes REST temporaires pour les services non migrés
    const interventions$ = this.http
      .get<any>(`${environment.services.maintenance}`)
      .pipe(catchError(() => of([])));

    const alerts$ = this.http
      .get<any>(`${environment.services.maintenance}/alerts/preventive`)
      .pipe(catchError(() => of([])));

    // 4. On combine le tout !
    forkJoin({
      gqlData: graphql$,
      interventionsRes: interventions$,
      alertsRes: alerts$,
    }).subscribe(({ gqlData, interventionsRes, alertsRes }) => {
      const vehicleList = gqlData?.vehicules ?? [];
      const conductorList = gqlData?.conducteurs ?? [];
      const interventionList: Intervention[] =
        interventionsRes['hydra:member'] ?? interventionsRes ?? [];
      const alertList: any[] = alertsRes['alerts'] ?? alertsRes ?? [];

      const enPanne = vehicleList.filter((v) => v.statut === 'en_panne').length;
      const enCours = interventionList.filter((i) => i.statut === 'in_progress').length;

      this.kpis.set([
        {
          label: 'Total Véhicules',
          value: vehicleList.length,
          icon: '🚗',
          color: '#4361ee',
          link: '/vehicules',
        },
        {
          label: 'Conducteurs Actifs',
          value: conductorList.length,
          icon: '👤',
          color: '#7209b7',
          link: '/conducteurs',
        },
        {
          label: 'Interventions Actives',
          value: enCours,
          icon: '🔧',
          color: '#f48c06',
          link: '/maintenance',
        },
        {
          label: 'Véhicules en Panne',
          value: enPanne,
          icon: '⚠️',
          color: '#e63946',
          trend: enPanne > 0 ? 'danger' : 'ok',
        },
        {
          label: 'Alertes Préventives',
          value: alertList.length,
          icon: '🔔',
          color: '#2ec4b6',
          trend: alertList.length > 0 ? 'warn' : 'ok',
        },
        {
          label: 'Total Interventions',
          value: interventionList.length,
          icon: '📋',
          color: '#06d6a0',
          link: '/maintenance',
        },
      ]);

      this.recentVehicles.set(vehicleList.slice(0, 5));
      this.recentInterventions.set(interventionList.slice(0, 5));
      this.alerts.set(alertList.slice(0, 4));
      this.isLoading.set(false);
    });
  }

  getStatutClass(statut: string): string {
    const map: Record<string, string> = {
      actif: 'badge-success',
      disponible: 'badge-success',
      en_panne: 'badge-danger',
      inactif: 'badge-danger',
      en_cours: 'badge-warning',
      en_mission: 'badge-info',
      en_maintenance: 'badge-warning',
      planifie: 'badge-info',
      termine: 'badge-success',
    };
    return map[statut] ?? 'badge-default';
  }
}

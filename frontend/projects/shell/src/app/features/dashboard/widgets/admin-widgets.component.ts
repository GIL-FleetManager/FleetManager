import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Apollo, gql } from 'apollo-angular';

interface KpiCard {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  trend?: string;
  link?: string;
}

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

  recentVehicles = signal<Vehicule[]>([]);
  recentInterventions = signal<Intervention[]>([]);
  alerts = signal<any[]>([]);

  ngOnInit(): void {
    this.apollo
      .query<{ vehicules: Vehicule[]; conducteurs: Conducteur[]; interventions: Intervention[] }>({
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
            interventions {
              id
              type_intervention
              statut
              date_planifiee
              vehicule_id
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .subscribe({
        next: (res) => {
          const vehicleList = res.data?.vehicules ?? [];
          const conductorList = res.data?.conducteurs ?? [];
          const interventionList = res.data?.interventions ?? [];

          const alertList = interventionList.filter((i) => i.statut === 'planifie');

          const enPanne = vehicleList.filter((v) => v.statut === 'en_panne').length;
          const enCours = interventionList.filter(
            (i) => i.statut === 'in_progress' || i.statut === 'en_cours',
          ).length;

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
        },
        error: (err) => {
          console.error('Erreur GraphQL Dashboard:', err);
          this.isLoading.set(false);
        },
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

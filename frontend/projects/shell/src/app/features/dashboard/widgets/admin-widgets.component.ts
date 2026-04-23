import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environements/environment';
import { forkJoin, catchError, of } from 'rxjs';

interface KpiCard {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  trend?: string;
  link?: string;
}

interface Vehicle {
  id: string;
  immatriculation: string;
  marque: string;
  modele: string;
  statut: string;
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
  private http = inject(HttpClient);

  isLoading = signal(true);
  kpis = signal<KpiCard[]>([]);
  recentVehicles = signal<Vehicle[]>([]);
  recentInterventions = signal<Intervention[]>([]);
  alerts = signal<any[]>([]);

  ngOnInit(): void {
    forkJoin({
      vehicles:      this.http.get<any>(`${environment.services.vehicles}/api/vehicles`).pipe(catchError(() => of({ 'hydra:member': [] }))),
      conductors:    this.http.get<any>(`${environment.services.drivers}/api/conductors`).pipe(catchError(() => of([]))),
      interventions: this.http.get<any>(`${environment.services.maintenance}/api/interventions`).pipe(catchError(() => of([]))),
      alerts:        this.http.get<any>(`${environment.services.maintenance}/api/interventions/alerts/preventive`).pipe(catchError(() => of([]))),
    }).subscribe(({ vehicles, conductors, interventions, alerts }) => {

      const vehicleList: Vehicle[] = vehicles['hydra:member'] ?? vehicles ?? [];
      const conductorList: any[]   = conductors['hydra:member'] ?? conductors ?? [];
      const interventionList: Intervention[] = interventions['hydra:member'] ?? interventions ?? [];
      const alertList: any[] = alerts['alerts'] ?? alerts ?? [];

      const enPanne    = vehicleList.filter((v: Vehicle) => v.statut === 'en_panne').length;
      const enCours    = interventionList.filter((i: Intervention) => i.statut === 'en_cours').length;

      this.kpis.set([
        { label: 'Total Véhicules',     value: vehicleList.length,     icon: '🚗', color: '#4361ee', link: '/vehicules' },
        { label: 'Conducteurs Actifs',  value: conductorList.length,   icon: '👤', color: '#7209b7', link: '/conducteurs' },
        { label: 'Interventions Actives', value: enCours,              icon: '🔧', color: '#f48c06', link: '/maintenance' },
        { label: 'Véhicules en Panne',  value: enPanne,                icon: '⚠️', color: '#e63946', trend: enPanne > 0 ? 'danger' : 'ok' },
        { label: 'Alertes Préventives', value: alertList.length,       icon: '🔔', color: '#2ec4b6', trend: alertList.length > 0 ? 'warn' : 'ok' },
        { label: 'Total Interventions', value: interventionList.length, icon: '📋', color: '#06d6a0', link: '/maintenance' },
      ]);

      this.recentVehicles.set(vehicleList.slice(0, 5));
      this.recentInterventions.set(interventionList.slice(0, 5));
      this.alerts.set(alertList.slice(0, 4));
      this.isLoading.set(false);
    });
  }

  getStatutClass(statut: string): string {
    const map: Record<string, string> = {
      actif: 'badge-success', disponible: 'badge-success',
      en_panne: 'badge-danger', inactif: 'badge-danger',
      en_cours: 'badge-warning', planifie: 'badge-info',
      termine: 'badge-success',
    };
    return map[statut] ?? 'badge-default';
  }
}

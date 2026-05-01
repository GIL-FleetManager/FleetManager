import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environements/environment';
import { forkJoin, catchError, of } from 'rxjs';

@Component({
  selector: 'app-manager-widgets',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    @if (isLoading()) {
      <div class="loading">
        <div class="spinner"></div>
        <p>Chargement...</p>
      </div>
    } @else {
      <div class="widget-grid">
        <div class="stat-card blue">
          <div class="stat-icon">👤</div>
          <div class="stat-body">
            <span class="stat-value">{{ conductors().length }}</span>
            <span class="stat-label">Conducteurs</span>
          </div>
        </div>
        <div class="stat-card orange">
          <div class="stat-icon">🔧</div>
          <div class="stat-body">
            <span class="stat-value">{{ interventionsEnCours() }}</span>
            <span class="stat-label">Interventions en cours</span>
          </div>
        </div>
        <div class="stat-card green">
          <div class="stat-icon">🚗</div>
          <div class="stat-body">
            <span class="stat-value">{{ vehiclesDisponibles() }}</span>
            <span class="stat-label">Véhicules disponibles</span>
          </div>
        </div>
      </div>

      <section class="card mt">
        <h3>👤 Conducteurs</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Prénom</th>
              <th>Téléphone</th>
              <th>Statut Permis</th>
            </tr>
          </thead>
          <tbody>
            @for (c of conductors().slice(0, 6); track c.id) {
              <tr>
                <td>{{ c.nom }}</td>
                <td>{{ c.prenom }}</td>
                <td>{{ c.telephone }}</td>
                <td>
                  <span class="badge badge-info">{{ c.statut ?? 'actif' }}</span>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="empty">Aucun conducteur</td>
              </tr>
            }
          </tbody>
        </table>
      </section>
    }
  `,
  styles: [
    `
      .loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 200px;
        gap: 1rem;
      }
      .spinner {
        width: 36px;
        height: 36px;
        border: 3px solid #e0e0e0;
        border-top-color: #7209b7;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .widget-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 1.2rem;
        margin-bottom: 1.5rem;
      }
      .stat-card {
        background: #fff;
        border-radius: 14px;
        padding: 1.4rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
      }
      .stat-icon {
        font-size: 2rem;
      }
      .stat-body {
        display: flex;
        flex-direction: column;
      }
      .stat-value {
        font-size: 1.8rem;
        font-weight: 700;
      }
      .stat-label {
        font-size: 0.75rem;
        color: #888;
      }
      .blue .stat-value {
        color: #7209b7;
      }
      .orange .stat-value {
        color: #f48c06;
      }
      .green .stat-value {
        color: #06d6a0;
      }
      .card {
        background: #fff;
        border-radius: 14px;
        padding: 1.4rem;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
      }
      .mt {
        margin-top: 0;
      }
      h3 {
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: 1rem;
      }
      .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
      }
      .data-table th {
        text-align: left;
        padding: 8px 12px;
        color: #888;
        font-weight: 600;
        font-size: 0.72rem;
        text-transform: uppercase;
        border-bottom: 1px solid #f0f0f0;
      }
      .data-table td {
        padding: 10px 12px;
        border-bottom: 1px solid #f8f8f8;
      }
      .data-table tr:last-child td {
        border-bottom: none;
      }
      .empty {
        text-align: center;
        color: #aaa;
        padding: 2rem;
      }
      .badge {
        padding: 3px 10px;
        border-radius: 99px;
        font-size: 0.72rem;
        font-weight: 600;
      }
      .badge-info {
        background: #e8f0fe;
        color: #4361ee;
      }
    `,
  ],
})
export class ManagerWidgetsComponent implements OnInit {
  private http = inject(HttpClient);

  isLoading = signal(true);
  conductors = signal<any[]>([]);
  interventionsEnCours = signal(0);
  vehiclesDisponibles = signal(0);

  ngOnInit(): void {
    forkJoin({
      conductors: this.http
        .get<any>(`${environment.services.drivers}`)
        .pipe(catchError(() => of([]))),
      interventions: this.http
        .get<any>(`${environment.services.maintenance}`)
        .pipe(catchError(() => of([]))),
      vehicles: this.http
        .get<any>(`${environment.services.vehicles}`)
        .pipe(catchError(() => of({ 'hydra:member': [] }))),
    }).subscribe(({ conductors, interventions, vehicles }) => {
      const c = conductors['hydra:member'] ?? conductors ?? [];
      const i = (interventions['hydra:member'] ?? interventions ?? []) as any[];
      const v = (vehicles['hydra:member'] ?? vehicles ?? []) as any[];

      this.conductors.set(c);
      this.interventionsEnCours.set(i.filter((x: any) => x.statut === 'en_cours').length);
      this.vehiclesDisponibles.set(
        v.filter((x: any) => x.statut === 'disponible' || x.statut === 'actif').length,
      );
      this.isLoading.set(false);
    });
  }
}

import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { catchError, of } from 'rxjs';
import { environment } from '../../../environements/environment';

@Component({
  selector: 'app-conducteur-widgets',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isLoading()) {
      <div class="loading">
        <div class="spinner"></div>
        <p>Chargement de vos missions...</p>
      </div>
    } @else {
      <div class="widget-grid">
        <div class="stat-card blue">
          <div class="stat-icon">📅</div>
          <div class="stat-body">
            <span class="stat-value">{{ missions().length }}</span>
            <span class="stat-label">Missions assignées</span>
          </div>
        </div>
        <div class="stat-card green">
          <div class="stat-icon">🚗</div>
          <div class="stat-body">
            <span class="stat-value">{{ missionEnCours() ? '1' : '0' }}</span>
            <span class="stat-label">Mission en cours</span>
          </div>
        </div>
      </div>

      <section class="card">
        <h3>📍 Mes Missions</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Véhicule</th>
              <th>Date</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            @for (m of missions(); track m.id) {
              <tr>
                <td>{{ m.vehicule_immatriculation || 'Non assigné' }}</td>
                <td>{{ m.date_debut | date: 'dd/MM/yyyy' }}</td>
                <td>
                  <span class="badge" [class]="getClass(m.statut)">{{ m.statut }}</span>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="3" class="empty">Aucune mission pour le moment</td>
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
        border-top-color: #4361ee;
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
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
        color: #4361ee;
      }
      .stat-label {
        font-size: 0.75rem;
        color: #888;
      }
      .card {
        background: #fff;
        border-radius: 14px;
        padding: 1.4rem;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
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
        padding: 10px;
        color: #888;
        border-bottom: 1px solid #f0f0f0;
      }
      .data-table td {
        padding: 10px;
        border-bottom: 1px solid #f8f8f8;
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
      .badge-warning {
        background: #fff3e0;
        color: #f48c06;
      }
      .badge-success {
        background: #e6f9f0;
        color: #2ec4b6;
      }
    `,
  ],
})
export class ConducteurWidgetsComponent implements OnInit {
  private http = inject(HttpClient);
  isLoading = signal(true);
  missions = signal<any[]>([]);
  missionEnCours = signal(false);
  vehiculeAssigné = signal<any>(null);

  ngOnInit(): void {
    this.http
      .get<any>(`${environment.services.drivers}/mon-vehicule-assigne`)
      .pipe(catchError(() => of(null)))
      .subscribe((data) => {
        this.vehiculeAssigné.set(data);
        this.isLoading.set(false);
      });
  }

  getClass(statut: string): string {
    const m: Record<string, string> = {
      en_cours: 'badge-warning',
      termine: 'badge-success',
      planifie: 'badge-info',
    };
    return m[statut] ?? 'badge-info';
  }
}

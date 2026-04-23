import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environements/environment';
import { forkJoin, catchError, of } from 'rxjs';

@Component({
  selector: 'app-technician-widgets',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isLoading()) {
      <div class="loading"><div class="spinner"></div><p>Chargement...</p></div>
    } @else {
      <div class="widget-grid">
        <div class="stat-card teal">
          <div class="stat-icon">🔧</div>
          <div class="stat-body">
            <span class="stat-value">{{ interventions().length }}</span>
            <span class="stat-label">Mes interventions</span>
          </div>
        </div>
        <div class="stat-card orange">
          <div class="stat-icon">⚠️</div>
          <div class="stat-body">
            <span class="stat-value">{{ alerts().length }}</span>
            <span class="stat-label">Alertes préventives</span>
          </div>
        </div>
        <div class="stat-card purple">
          <div class="stat-icon">✅</div>
          <div class="stat-body">
            <span class="stat-value">{{ interventionsTerminees() }}</span>
            <span class="stat-label">Terminées</span>
          </div>
        </div>
      </div>

      <section class="card">
        <h3>🔧 Mes Interventions</h3>
        <ul class="intervention-list">
          @for (i of interventions().slice(0, 6); track i.id) {
            <li class="intervention-item">
              <div class="inter-icon">{{ i.statut === 'en_cours' ? '🔄' : i.statut === 'termine' ? '✅' : '📋' }}</div>
              <div class="inter-body">
                <strong>{{ i.type_intervention }}</strong>
                <small>{{ i.date_debut | date:'dd/MM/yyyy' }}</small>
              </div>
              <span class="badge" [class]="getClass(i.statut)">{{ i.statut }}</span>
            </li>
          } @empty {
            <li class="empty">Aucune intervention assignée</li>
          }
        </ul>
      </section>

      @if (alerts().length > 0) {
        <section class="card alert-section">
          <h3>🔔 Alertes Préventives</h3>
          @for (a of alerts(); track $index) {
            <div class="alert-row">
              <span>⚠️</span>
              <span>{{ a.type_intervention ?? 'Maintenance requise' }} — Véhicule {{ a.vehicule_id ?? 'N/A' }}</span>
            </div>
          }
        </section>
      }
    }
  `,
  styles: [`
    .loading{display:flex;flex-direction:column;align-items:center;justify-content:center;height:200px;gap:1rem}
    .spinner{width:36px;height:36px;border:3px solid #e0e0e0;border-top-color:#2ec4b6;border-radius:50%;animation:spin 0.8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .widget-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1.2rem;margin-bottom:1.5rem}
    .stat-card{background:#fff;border-radius:14px;padding:1.4rem;display:flex;align-items:center;gap:1rem;box-shadow:0 2px 10px rgba(0,0,0,.06)}
    .stat-icon{font-size:2rem}
    .stat-body{display:flex;flex-direction:column}
    .stat-value{font-size:1.8rem;font-weight:700}
    .stat-label{font-size:.75rem;color:#888}
    .teal .stat-value{color:#2ec4b6} .orange .stat-value{color:#f48c06} .purple .stat-value{color:#7209b7}
    .card{background:#fff;border-radius:14px;padding:1.4rem;box-shadow:0 2px 10px rgba(0,0,0,.06);margin-bottom:1.5rem}
    h3{font-size:1rem;font-weight:600;margin-bottom:1rem}
    .intervention-list{list-style:none;display:flex;flex-direction:column;gap:.75rem}
    .intervention-item{display:flex;align-items:center;gap:.75rem;padding:.75rem;border-radius:10px;background:#f9f9f9}
    .inter-icon{font-size:1.3rem}
    .inter-body{display:flex;flex-direction:column;flex:1;strong{font-size:.875rem}small{color:#888;font-size:.75rem}}
    .empty{text-align:center;color:#aaa;padding:2rem}
    .badge{padding:3px 10px;border-radius:99px;font-size:.72rem;font-weight:600}
    .badge-success{background:#e6f9f0;color:#2ec4b6} .badge-danger{background:#ffe0e0;color:#e63946}
    .badge-warning{background:#fff3e0;color:#f48c06} .badge-default{background:#f0f0f0;color:#666}
    .alert-section h3{margin-bottom:.75rem}
    .alert-row{display:flex;gap:.75rem;align-items:center;padding:.6rem .75rem;background:#fff8e1;border-radius:8px;border-left:4px solid #f48c06;margin-bottom:.5rem;font-size:.875rem}
  `]
})
export class TechnicianWidgetsComponent implements OnInit {
  private http = inject(HttpClient);

  isLoading           = signal(true);
  interventions       = signal<any[]>([]);
  alerts              = signal<any[]>([]);
  interventionsTerminees = signal(0);

  ngOnInit(): void {
    forkJoin({
      interventions: this.http.get<any>(`${environment.services.maintenance}/api/interventions`).pipe(catchError(() => of([]))),
      alerts:        this.http.get<any>(`${environment.services.maintenance}/api/interventions/alerts/preventive`).pipe(catchError(() => of([]))),
    }).subscribe(({ interventions, alerts }) => {
      const i = (interventions['hydra:member'] ?? interventions ?? []) as any[];
      const a = (alerts['alerts'] ?? alerts ?? []) as any[];
      this.interventions.set(i);
      this.alerts.set(a);
      this.interventionsTerminees.set(i.filter((x: any) => x.statut === 'termine').length);
      this.isLoading.set(false);
    });
  }

  getClass(statut: string): string {
    const m: Record<string, string> = {
      en_cours: 'badge-warning', termine: 'badge-success',
      planifie: 'badge-default', annule: 'badge-danger',
    };
    return m[statut] ?? 'badge-default';
  }
}

import { Component, inject, signal, Input, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ConducteursService, Conductor } from '../../conducteurs/services/conducteurs';

@Component({
  selector: 'app-conducteur-widgets',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="conducteur-dashboard">

      @if (loading()) {
        <div class="cond-loading">
          <div class="spinner"></div>
          <p>Chargement de votre profil…</p>
        </div>
      } @else if (notFound()) {
        <div class="cond-not-found">
          <span>😕</span>
          <h3>Profil introuvable</h3>
          <p>Votre compte Keycloak (<strong>{{ email }}</strong>) n'est pas encore lié à un conducteur dans le système.</p>
          <p>Contactez votre administrateur.</p>
        </div>
      } @else if (conducteur()) {
        <!-- Profile card -->
        <div class="profile-card">
          <div class="avatar">{{ initials() }}</div>
          <div class="profile-info">
            <h2>{{ conducteur()!.prenom }} {{ conducteur()!.nom }}</h2>
            <p class="profile-email">✉️ {{ conducteur()!.email }}</p>
            @if (conducteur()!.telephone) {
              <p class="profile-phone">📞 {{ conducteur()!.telephone }}</p>
            }
            <span class="badge" [ngClass]="statutClass(conducteur()!.statut)">
              {{ conducteur()!.statut | titlecase }}
            </span>
          </div>
        </div>

        <!-- License card -->
        <div class="info-grid">
          <div class="info-card" [ngClass]="{ 'card-danger': isExpired(), 'card-warning': !isExpired() && isExpiringSoon() }">
            <div class="info-card-icon">🪪</div>
            <div class="info-card-body">
              <span class="info-label">N° Permis de conduire</span>
              <span class="info-value">{{ conducteur()!.numeroPermis }}</span>
            </div>
          </div>

          <div class="info-card" [ngClass]="{ 'card-danger': isExpired(), 'card-warning': !isExpired() && isExpiringSoon() }">
            <div class="info-card-icon">
              @if (isExpired()) { ⛔ }
              @else if (isExpiringSoon()) { ⚠️ }
              @else { ✅ }
            </div>
            <div class="info-card-body">
              <span class="info-label">Date d'expiration du permis</span>
              <span class="info-value">{{ conducteur()!.dateExpirationPermis | date:'dd MMMM yyyy':'':'fr' }}</span>
              @if (isExpired()) {
                <span class="alert-text danger">Permis expiré ! Renouvelez-le immédiatement.</span>
              } @else if (isExpiringSoon()) {
                <span class="alert-text warning">Expire dans {{ daysLeft() }} jours — pensez au renouvellement.</span>
              } @else {
                <span class="alert-text ok">Permis valide (encore {{ daysLeft() }} jours).</span>
              }
            </div>
          </div>
        </div>

        <!-- Status alert -->
        @if (conducteur()!.statut === 'suspendu') {
          <div class="status-alert danger">
            🚫 Votre compte est <strong>suspendu</strong>. Vous ne pouvez pas conduire. Contactez votre responsable.
          </div>
        } @else if (conducteur()!.statut === 'inactif') {
          <div class="status-alert warning">
            ⏸️ Votre compte est <strong>inactif</strong>. Contactez votre responsable pour le réactiver.
          </div>
        }
      }

    </div>
  `,
  styles: [`
    .conducteur-dashboard { display: flex; flex-direction: column; gap: 1.5rem; }

    .cond-loading, .cond-not-found {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 1rem; padding: 3rem; background: #fff; border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0,0,0,.06); text-align: center;
      span { font-size: 3rem; }
      h3 { font-size: 1.2rem; font-weight: 700; color: #333; }
      p { color: #888; font-size: .9rem; }
    }
    .spinner {
      width: 40px; height: 40px; border: 3px solid #e0e0e0;
      border-top-color: #4361ee; border-radius: 50%; animation: spin .8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Profile card */
    .profile-card {
      display: flex; align-items: center; gap: 1.5rem;
      background: linear-gradient(135deg, #4361ee, #3a0ca3);
      border-radius: 20px; padding: 2rem; color: #fff;
    }
    .avatar {
      width: 72px; height: 72px; border-radius: 50%; background: rgba(255,255,255,.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.8rem; font-weight: 700; flex-shrink: 0;
    }
    .profile-info {
      display: flex; flex-direction: column; gap: .4rem;
      h2 { font-size: 1.5rem; font-weight: 700; }
      p { font-size: .9rem; opacity: .85; }
    }
    .badge {
      display: inline-block; padding: 4px 14px; border-radius: 99px; font-size: .8rem; font-weight: 700;
      &.badge-success { background: #e6f9f0; color: #2ec4b6; }
      &.badge-danger  { background: #ffe0e0; color: #e63946; }
      &.badge-default { background: #f0f0f0; color: #555; }
    }

    /* Info grid */
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .info-card {
      display: flex; align-items: flex-start; gap: 1rem;
      background: #fff; border-radius: 16px; padding: 1.4rem;
      box-shadow: 0 2px 10px rgba(0,0,0,.06);
      border-left: 4px solid #4361ee;
      &.card-warning { border-left-color: #f48c06; background: #fffbf0; }
      &.card-danger  { border-left-color: #e63946; background: #fff5f5; }
      .info-card-icon { font-size: 1.6rem; }
    }
    .info-card-body { display: flex; flex-direction: column; gap: .3rem; }
    .info-label { font-size: .75rem; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: .5px; }
    .info-value { font-size: 1.1rem; font-weight: 700; color: #1a1a2e; }
    .alert-text {
      font-size: .8rem; font-weight: 600;
      &.danger  { color: #e63946; }
      &.warning { color: #f48c06; }
      &.ok      { color: #2ec4b6; }
    }

    /* Status alert */
    .status-alert {
      padding: 1rem 1.5rem; border-radius: 12px; font-size: .95rem;
      &.danger  { background: #ffe0e0; color: #e63946; border-left: 4px solid #e63946; }
      &.warning { background: #fff3e0; color: #f48c06; border-left: 4px solid #f48c06; }
    }

    @media (max-width: 600px) {
      .info-grid { grid-template-columns: 1fr; }
      .profile-card { flex-direction: column; text-align: center; }
    }
  `]
})
export class ConducteurWidgetsComponent implements OnInit {
  @Input() email = '';

  private svc = inject(ConducteursService);

  conducteur = signal<Conductor | undefined>(undefined);
  loading    = signal(true);
  notFound   = signal(false);

  initials = () => {
    const c = this.conducteur();
    if (!c) return '?';
    return `${c.prenom[0] ?? ''}${c.nom[0] ?? ''}`.toUpperCase();
  };

  ngOnInit(): void {
    if (!this.email) { this.loading.set(false); this.notFound.set(true); return; }
    this.svc.getByEmail(this.email).subscribe({
      next: (c) => {
        this.conducteur.set(c);
        this.notFound.set(!c);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.notFound.set(true); }
    });
  }

  daysLeft(): number {
    const c = this.conducteur();
    if (!c) return 0;
    return Math.ceil((new Date(c.dateExpirationPermis).getTime() - Date.now()) / 86400000);
  }

  isExpired(): boolean    { return this.daysLeft() < 0; }
  isExpiringSoon(): boolean { return this.daysLeft() >= 0 && this.daysLeft() <= 30; }

  statutClass(s: string): string {
    return s === 'actif' ? 'badge-success' : s === 'suspendu' ? 'badge-danger' : 'badge-default';
  }
}

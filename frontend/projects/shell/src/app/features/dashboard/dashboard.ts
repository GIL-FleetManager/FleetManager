import { Component, inject, signal, OnInit } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { AdminWidgetsComponent } from './widgets/admin-widgets.component';
import { ManagerWidgetsComponent } from './widgets/manager-widgets.component';
import { TechnicianWidgetsComponent } from './widgets/technician-widgets.component';
import { ConducteurWidgetsComponent } from './widgets/conducteur-widgets.component';


export type UserRole = 'admin' | 'manager' | 'technician' | 'conducteur' | 'unknown';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AdminWidgetsComponent, ManagerWidgetsComponent, TechnicianWidgetsComponent, ConducteurWidgetsComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  private readonly keycloak = inject(KeycloakService);

  readonly userName    = signal<string>('');
  readonly userEmail   = signal<string>('');
  readonly userRole    = signal<UserRole>('unknown');
  readonly isLoading   = signal<boolean>(true);
  readonly currentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  async ngOnInit(): Promise<void> {
    try {
      const profile = await this.keycloak.loadUserProfile();
      const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
      this.userName.set(fullName || profile.username || 'Utilisateur');
      this.userEmail.set(profile.email ?? '');

      const kc = this.keycloak.getKeycloakInstance();

      // Keycloak 26.x : hasRealmRole() est la méthode fiable
      const isAdmin      = kc.hasRealmRole('admin');
      const isManager    = kc.hasRealmRole('manager');
      const isTechnician = kc.hasRealmRole('technician');
      const isConducteur = kc.hasRealmRole('conducteur');

      console.log('[Dashboard] hasRealmRole admin:', isAdmin);
      console.log('[Dashboard] hasRealmRole manager:', isManager);
      console.log('[Dashboard] hasRealmRole technician:', isTechnician);
      console.log('[Dashboard] hasRealmRole conducteur:', isConducteur);
      console.log('[Dashboard] tokenParsed:', kc.tokenParsed);

      if (isAdmin)           this.userRole.set('admin');
      else if (isManager)    this.userRole.set('manager');
      else if (isTechnician) this.userRole.set('technician');
      else if (isConducteur) this.userRole.set('conducteur');
      else                   this.userRole.set('unknown');

      console.log('[Dashboard] Rôle final:', this.userRole());
    } catch (err) {
      console.error('[Dashboard] Erreur:', err);
      this.userName.set('Utilisateur');
      this.userRole.set('unknown');
    } finally {
      this.isLoading.set(false);
    }
  }

  logout(): void {
    this.keycloak.logout(window.location.origin);
  }

  getRoleLabel(): string {
    const labels: Record<UserRole, string> = {
      admin:      '👑 Administrateur',
      manager:    '📋 Manager',
      technician: '🔧 Technicien',
      conducteur: '🚗 Conducteur',
      unknown:    '❓ Inconnu',
    };
    return labels[this.userRole()];
  }
}


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
  imports: [
    AdminWidgetsComponent,
    ManagerWidgetsComponent,
    TechnicianWidgetsComponent,
    ConducteurWidgetsComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  private readonly keycloak = inject(KeycloakService);

  readonly userName = signal<string>('');
  readonly userRole = signal<UserRole>('unknown');
  readonly isLoading = signal<boolean>(true);
  readonly currentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  async ngOnInit(): Promise<void> {
    try {
      const profile = await this.keycloak.loadUserProfile();
      const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
      this.userName.set(fullName || profile.username || 'Utilisateur');

      const tokenParsed = this.keycloak.getKeycloakInstance().tokenParsed;
      const realmRoles: string[] = tokenParsed?.realm_access?.roles ?? [];
      const clientRoles: string[] = tokenParsed?.resource_access?.['ton-client-id']?.roles ?? [];
      const roles = [...realmRoles, ...clientRoles];

      console.log('User roles:', roles);
      if (roles.includes('admin')) this.userRole.set('admin');
      else if (roles.includes('manager')) this.userRole.set('manager');
      else if (roles.includes('technicien')) this.userRole.set('technician');
      else if (roles.includes('conducteur')) this.userRole.set('conducteur');
      else this.userRole.set('unknown');
    } catch {
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
      admin: '👑 Administrateur',
      manager: '📋 Manager',
      technician: '🔧 Technicien',
      conducteur: '🚗 Conducteur',
      unknown: '❓ Inconnu',
    };
    return labels[this.userRole()];
  }
}

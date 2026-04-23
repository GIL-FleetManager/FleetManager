import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent implements OnInit {
  private keycloak = inject(KeycloakService);
  readonly role = signal<string>('unknown');

  ngOnInit(): void {
    // Keycloak est déjà initialisé ici (APP_INITIALIZER le fait avant)
    // Pas besoin d'async - on lit directement l'instance
    try {
      const kc = this.keycloak.getKeycloakInstance();
      if (kc.hasRealmRole('admin'))           this.role.set('admin');
      else if (kc.hasRealmRole('manager'))    this.role.set('manager');
      else if (kc.hasRealmRole('technician')) this.role.set('technician');
      else if (kc.hasRealmRole('conducteur')) this.role.set('conducteur');
      console.log('[Nav] role:', this.role());
    } catch (err) {
      console.error('[AppNav] Erreur:', err);
    }
  }

  isAdmin()      { return this.role() === 'admin'; }
  isManager()    { return ['admin', 'manager'].includes(this.role()); }
  isConducteur() { return this.role() === 'conducteur'; }
}
import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  constructor(private readonly keycloakService: KeycloakService) {}

  logout() {
    this.keycloakService.logout('http://localhost:4200');
  }
}
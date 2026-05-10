import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { HasRoleDirective } from './has-role.directive';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, HasRoleDirective],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class AppComponent {}

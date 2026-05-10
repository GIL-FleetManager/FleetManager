import { Directive, Input, TemplateRef, ViewContainerRef, inject, OnInit } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';

@Directive({
  selector: '[appHasRole]',
  standalone: true,
})
export class HasRoleDirective implements OnInit {
  private templateRef = inject(TemplateRef);
  private viewContainer = inject(ViewContainerRef);
  private keycloak = inject(KeycloakService);

  private requiredRoles: string[] = [];

  @Input() set appHasRole(roles: string[] | string) {
    this.requiredRoles = Array.isArray(roles) ? roles : [roles];
    this.updateView();
  }

  ngOnInit() {
    this.updateView();
  }

  private updateView() {
    const tokenParsed = this.keycloak.getKeycloakInstance().tokenParsed;
    const realmRoles = tokenParsed?.realm_access?.roles ?? [];
    const clientRoles = tokenParsed?.resource_access?.['fleet-frontend']?.roles ?? [];
    const userRoles = [...realmRoles, ...clientRoles];

    const hasAccess = this.requiredRoles.some((role) => userRoles.includes(role));

    this.viewContainer.clear();
    if (hasAccess) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}

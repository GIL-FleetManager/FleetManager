import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environements/environment';

export interface Conductor {
  id?: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  numeroPermis: string;
  dateExpirationPermis: string; // format YYYY-MM-DD
  statut: 'actif' | 'inactif' | 'suspendu';
  createdAt?: string;
  updatedAt?: string;
}

const LD_HEADERS = new HttpHeaders({
  'Content-Type': 'application/ld+json',
  'Accept': 'application/ld+json',
});

@Injectable({ providedIn: 'root' })
export class ConducteursService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.services.drivers}/api/conductors`;

  getAll(): Observable<Conductor[]> {
    return this.http
      .get<{ member: Conductor[] }>(this.base, { headers: LD_HEADERS })
      .pipe(map(res => res.member ?? []));
  }

  getOne(id: string): Observable<Conductor> {
    return this.http.get<Conductor>(`${this.base}/${id}`, { headers: LD_HEADERS });
  }

  create(data: Omit<Conductor, 'id' | 'createdAt' | 'updatedAt'>): Observable<Conductor> {
    return this.http.post<Conductor>(this.base, data, { headers: LD_HEADERS });
  }

  update(id: string, data: Partial<Conductor>): Observable<Conductor> {
    return this.http.put<Conductor>(`${this.base}/${id}`, data, { headers: LD_HEADERS });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`, { headers: LD_HEADERS });
  }

  /** Retrouve le conducteur dont l'email correspond à celui du compte Keycloak connecté */
  getByEmail(email: string): Observable<Conductor | undefined> {
    return this.getAll().pipe(
      map(list => list.find(c => c.email.toLowerCase() === email.toLowerCase()))
    );
  }
}

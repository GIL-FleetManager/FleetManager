import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environements/environment';

export interface Vehicle {
  id?: string;
  immatriculation: string;
  marque: string;
  modele: string;
  statut: 'disponible' | 'en_mission' | 'en_panne' | 'en_maintenance';
}

const LD_HEADERS = new HttpHeaders({
  'Content-Type': 'application/ld+json',
  'Accept': 'application/ld+json',
});

@Injectable({ providedIn: 'root' })
export class ServiceVehicules {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.services.vehicles}/api/vehicles`;

  getAll(): Observable<Vehicle[]> {
    return this.http
      .get<{ member: Vehicle[] }>(this.base, { headers: LD_HEADERS })
      .pipe(map(res => res.member ?? []));
  }

  getOne(id: string): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${this.base}/${id}`, { headers: LD_HEADERS });
  }

  create(vehicle: Omit<Vehicle, 'id'>): Observable<Vehicle> {
    return this.http.post<Vehicle>(this.base, vehicle, { headers: LD_HEADERS });
  }

  update(id: string, vehicle: Partial<Vehicle>): Observable<Vehicle> {
    return this.http.put<Vehicle>(`${this.base}/${id}`, vehicle, { headers: LD_HEADERS });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`, { headers: LD_HEADERS });
  }
}



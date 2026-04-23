import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConducteursService {

  private apiUrl = 'http://localhost:8082/api/conductors';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  getById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  create(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data, {
      headers: { 'Content-Type': 'application/ld+json' }
    });
  }

  update(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, data, {
      headers: { 'Content-Type': 'application/merge-patch+json' }
    });
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
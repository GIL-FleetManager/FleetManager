import { Component, AfterViewInit, OnDestroy, inject } from '@angular/core';
import * as L from 'leaflet';
import { Apollo, gql } from 'apollo-angular';
import { Subscription, interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';

const GET_VEHICLE_LOCATIONS = gql`
  query GetMapData {
    vehicules {
      id
      immatriculation
      modele
      location {
        latitude
        longitude
        speed
      }
    }
  }
`;

@Component({
  selector: 'app-fleet-map',
  standalone: true,
  templateUrl: './map.html',
  styleUrls: ['./map.scss'],
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private map!: L.Map;
  private markers: Map<string, L.Marker> = new Map();
  private apollo = inject(Apollo);
  private querySubscription?: Subscription;

  ngAfterViewInit(): void {
    this.initMap();
    this.startTracking();
  }

  private initMap(): void {
    // Center on France by default
    this.map = L.map('map').setView([46.2276, 2.2137], 6);

    const iconDefault = L.icon({
      iconUrl: '/marker-icon.png',
      iconSize: [25, 31],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41],
    });
    L.Marker.prototype.options.icon = iconDefault;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);
  }

  private startTracking(): void {
    // Refresh data every 10 seconds
    this.querySubscription = interval(10000)
      .pipe(
        startWith(0),
        switchMap(() =>
          this.apollo.query<any>({
            query: GET_VEHICLE_LOCATIONS,
            fetchPolicy: 'network-only',
          }),
        ),
      )
      .subscribe(({ data }) => {
        this.updateMarkers(data.vehicules);
      });
  }

  private updateMarkers(vehicles: any[]): void {
    vehicles.forEach((v) => {
      if (!v.location) return;

      const { latitude, longitude } = v.location;
      const pos: L.LatLngExpression = [latitude, longitude];

      if (this.markers.has(v.id)) {
        this.markers.get(v.id)!.setLatLng(pos);
      } else {
        const marker = L.marker(pos)
          .addTo(this.map)
          .bindPopup(
            `<b>${v.marque} ${v.modele}</b><br>${v.immatriculation}<br>Speed: ${v.location.speed?.toFixed(1)} km/h`,
          );
        this.markers.set(v.id, marker);
      }
    });
  }

  ngOnDestroy(): void {
    this.querySubscription?.unsubscribe();
  }
}

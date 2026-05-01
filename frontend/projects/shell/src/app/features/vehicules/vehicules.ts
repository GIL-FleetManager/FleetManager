import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceVehicules, Vehicle } from './services/service-vehicules';
import { Subscription } from 'rxjs';

type ModalMode = 'create' | 'edit' | null;

@Component({
  selector: 'app-vehicules',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicules.html',
  styleUrl: './vehicules.scss',
})
export class Vehicules implements OnInit, OnDestroy {
  private readonly svc = inject(ServiceVehicules);
  private readonly eventSub?: Subscription;

  // State Management with Signals
  vehicles = signal<Vehicle[]>([]);
  isLoading = signal(true);
  error = signal('');
  search = signal('');
  modalMode = signal<ModalMode>(null);
  saving = signal(false);
  deleteId = signal<string | null>(null);

  toast = signal<{ msg: string; type: 'success' | 'error' | 'warning' } | null>(null);

  form: Omit<Vehicle, 'id'> = { plateNumber: '', brand: '', model: '', status: 'available' };
  editingId: string | null = null;

  statuts: Vehicle['status'][] = ['available', 'in_mission', 'broken', 'maintenance'];

  filtered = computed(() => {
    const q = this.search().toLowerCase();
    return this.vehicles().filter(
      (v) =>
        v.plateNumber?.toLowerCase().includes(q) ||
        v.brand?.toLowerCase().includes(q) ||
        v.model?.toLowerCase().includes(q),
    );
  });

  ngOnInit(): void {
    this.load();
    this.setupRealTimeEvents();
  }

  ngOnDestroy(): void {
    if (this.eventSub) {
      this.eventSub.unsubscribe();
    }
  }

  /**
   * TODO:: Event Service  Integration
   * Placeholder to listen for Kafka alerts via GraphQL Subscriptions or WebSockets
   */
  setupRealTimeEvents(): void {
    console.log('Listening for events from Python Service...');
  }

  load(): void {
    this.isLoading.set(true);
    this.svc.getAll().subscribe({
      next: (data) => {
        this.vehicles.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('GraphQL Error:', err);
        this.error.set('Erreur lors du chargement via le Gateway');
        this.isLoading.set(false);
      },
    });
  }

  openCreate(): void {
    this.form = { plateNumber: '', brand: '', model: '', status: 'available' };
    this.editingId = null;
    this.modalMode.set('create');
  }

  openEdit(v: Vehicle): void {
    this.form = {
      plateNumber: v.plateNumber,
      brand: v.brand,
      model: v.model,
      status: v.status,
    };
    this.editingId = v.id!;
    this.modalMode.set('edit');
  }

  closeModal(): void {
    this.modalMode.set(null);
  }

  save(): void {
    this.saving.set(true);
    const isCreate = this.modalMode() === 'create';
    const obs = isCreate ? this.svc.create(this.form) : this.svc.update(this.editingId!, this.form);

    obs.subscribe({
      next: () => {
        this.showToast(isCreate ? 'Véhicule créé ✅' : 'Véhicule modifié ✅', 'success');
        this.closeModal();
        this.load();
        this.saving.set(false);
      },
      error: (err) => {
        console.error('Mutation Error:', err);
        this.showToast("Erreur d'enregistrement (GraphQL)", 'error');
        this.saving.set(false);
      },
    });
  }

  confirmDelete(id: string): void {
    this.deleteId.set(id);
  }

  cancelDelete(): void {
    this.deleteId.set(null);
  }

  doDelete(): void {
    this.svc.delete(this.deleteId()!).subscribe({
      next: () => {
        this.showToast('Véhicule supprimé', 'success');
        this.deleteId.set(null);
        this.load();
      },
      error: () => {
        this.showToast('Erreur lors de la suppression', 'error');
        this.deleteId.set(null);
      },
    });
  }

  showToast(msg: string, type: 'success' | 'error' | 'warning'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 4000);
  }

  statutClass(statut: string): string {
    const m: Record<string, string> = {
      disponible: 'badge-success',
      en_mission: 'badge-info',
      en_panne: 'badge-danger',
      en_maintenance: 'badge-warning',
    };
    return m[statut] ?? 'badge-default';
  }

  statutLabel(statut: string): string {
    const m: Record<string, string> = {
      disponible: 'Disponible',
      en_mission: 'En mission',
      en_panne: 'En panne',
      en_maintenance: 'En maintenance',
    };
    return m[statut] ?? statut;
  }
}

import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceVehicules, Vehicle } from './services/service-vehicules';

type ModalMode = 'create' | 'edit' | null;

@Component({
  selector: 'app-vehicules',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicules.html',
  styleUrl: './vehicules.scss',
})
export class Vehicules implements OnInit {
  private svc = inject(ServiceVehicules);

  vehicles    = signal<Vehicle[]>([]);
  isLoading   = signal(true);
  error       = signal('');
  search      = signal('');
  modalMode   = signal<ModalMode>(null);
  saving      = signal(false);
  deleteId    = signal<string | null>(null);
  toast       = signal<{ msg: string; type: 'success' | 'error' } | null>(null);

  form: Omit<Vehicle, 'id'> = { immatriculation: '', marque: '', modele: '', statut: 'disponible' };
  editingId: string | null = null;

  statuts: Vehicle['statut'][] = ['disponible', 'en_mission', 'en_panne', 'en_maintenance'];

  filtered = computed(() => {
    const q = this.search().toLowerCase();
    return this.vehicles().filter(v =>
      v.immatriculation.toLowerCase().includes(q) ||
      v.marque.toLowerCase().includes(q) ||
      v.modele.toLowerCase().includes(q)
    );
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading.set(true);
    this.svc.getAll().subscribe({
      next: (data) => { this.vehicles.set(data); this.isLoading.set(false); },
      error: () => { this.error.set('Erreur lors du chargement'); this.isLoading.set(false); }
    });
  }

  openCreate(): void {
    this.form = { immatriculation: '', marque: '', modele: '', statut: 'disponible' };
    this.editingId = null;
    this.modalMode.set('create');
  }

  openEdit(v: Vehicle): void {
    this.form = { immatriculation: v.immatriculation, marque: v.marque, modele: v.modele, statut: v.statut };
    this.editingId = v.id!;
    this.modalMode.set('edit');
  }

  closeModal(): void { this.modalMode.set(null); }

  save(): void {
    this.saving.set(true);
    const obs = this.modalMode() === 'create'
      ? this.svc.create(this.form)
      : this.svc.update(this.editingId!, this.form);

    obs.subscribe({
      next: () => {
        this.showToast(this.modalMode() === 'create' ? 'Véhicule créé ✅' : 'Véhicule modifié ✅', 'success');
        this.closeModal();
        this.load();
        this.saving.set(false);
      },
      error: () => { this.showToast('Erreur lors de l\'enregistrement', 'error'); this.saving.set(false); }
    });
  }

  confirmDelete(id: string): void { this.deleteId.set(id); }
  cancelDelete(): void { this.deleteId.set(null); }

  doDelete(): void {
    this.svc.delete(this.deleteId()!).subscribe({
      next: () => { this.showToast('Véhicule supprimé', 'success'); this.deleteId.set(null); this.load(); },
      error: () => { this.showToast('Erreur lors de la suppression', 'error'); this.deleteId.set(null); }
    });
  }

  showToast(msg: string, type: 'success' | 'error'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 3000);
  }

  statutClass(statut: string): string {
    const m: Record<string, string> = {
      disponible: 'badge-success', en_mission: 'badge-info',
      en_panne: 'badge-danger', en_maintenance: 'badge-warning',
    };
    return m[statut] ?? 'badge-default';
  }

  statutLabel(statut: string): string {
    const m: Record<string, string> = {
      disponible: 'Disponible', en_mission: 'En mission',
      en_panne: 'En panne', en_maintenance: 'En maintenance',
    };
    return m[statut] ?? statut;
  }
}


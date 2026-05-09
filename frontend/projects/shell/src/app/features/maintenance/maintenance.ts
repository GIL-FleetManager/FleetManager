import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceMaintenance, Intervention } from './services/service-maintenance';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './maintenance.html',
  styleUrls: ['./maintenance.scss'],
})
export class Maintenance implements OnInit {
  // Signals for state management
  interventions = signal<Intervention[]>([]);
  search = signal('');
  isLoading = signal(true);
  error = signal<string | null>(null);
  saving = signal(false);
  modalMode = signal<'create' | 'edit' | null>(null);
  deleteId = signal<string | null>(null);
  toast = signal<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Form State
  form = { id: '', vehicule_id: '', type_intervention: '', statut: 'planifie', date_planifiee: '' };
  statuts = ['planifie', 'en_cours', 'termine', 'annule'];

  // Computed signal for the search bar
  filtered = computed(() => {
    const s = this.search().toLowerCase();
    return this.interventions().filter(
      (i) =>
        i.vehicule_id?.toLowerCase().includes(s) || i.type_intervention?.toLowerCase().includes(s),
    );
  });

  constructor(private readonly maintenanceService: ServiceMaintenance) {}

  ngOnInit() {
    this.loadInterventions();
  }

  loadInterventions() {
    this.isLoading.set(true);
    this.maintenanceService.getInterventions().subscribe({
      next: (data) => {
        this.interventions.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('Impossible de charger les interventions.');
        this.isLoading.set(false);
      },
    });
  }

  // --- Modal & Form Logic ---

  openCreate() {
    this.form = {
      id: '',
      vehicule_id: '',
      type_intervention: '',
      statut: 'planifie',
      date_planifiee: '',
    };
    this.modalMode.set('create');
  }

  openEdit(intervention: Intervention) {
    this.form = { ...intervention };
    this.modalMode.set('edit');
  }

  closeModal() {
    this.modalMode.set(null);
  }

  save() {
    if (!this.form.vehicule_id || !this.form.type_intervention || !this.form.date_planifiee) {
      this.showToast('Veuillez remplir les champs obligatoires.', 'error');
      return;
    }

    this.saving.set(true);

    if (this.modalMode() === 'create') {
      this.maintenanceService
        .createIntervention(
          this.form.vehicule_id,
          this.form.type_intervention,
          this.form.date_planifiee,
        )
        .subscribe({
          next: (newIntervention) => {
            this.interventions.update((list) => [...list, newIntervention]);
            this.showToast('Intervention créée avec succès !', 'success');
            this.saving.set(false);
            this.closeModal();
          },
          error: (err) => {
            console.error(err);
            this.showToast('Erreur lors de la création.', 'error');
            this.saving.set(false);
          },
        });
    } else {
      // Future Update Logic goes here
      this.showToast('Modification non implémentée pour le moment.', 'info' as any);
      this.saving.set(false);
      this.closeModal();
    }
  }

  // --- Delete Logic (UI Only for now) ---
  confirmDelete(id: string) {
    this.deleteId.set(id);
  }

  cancelDelete() {
    this.deleteId.set(null);
  }

  doDelete() {
    // Future Delete Logic goes here
    this.interventions.update((list) => list.filter((i) => i.id !== this.deleteId()));
    this.showToast('Intervention supprimée.', 'success');
    this.deleteId.set(null);
  }

  // --- UI Helpers ---

  showToast(msg: string, type: 'success' | 'error') {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 3000);
  }

  statutLabel(statut: string): string {
    const labels: Record<string, string> = {
      planifie: 'Planifiée',
      en_cours: 'En cours',
      termine: 'Terminée',
      annule: 'Annulée',
    };
    return labels[statut] || statut;
  }

  statutClass(statut: string): string {
    const classes: Record<string, string> = {
      planifie: 'badge-info',
      en_cours: 'badge-warning',
      termine: 'badge-success',
      annule: 'badge-danger',
    };
    return classes[statut] || 'badge-default';
  }
}

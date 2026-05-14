import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceMaintenance, Intervention, Technicien, Vehicule } from './services/service-maintenance';
import { HasRoleDirective } from '../../has-role.directive';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule, HasRoleDirective],
  templateUrl: './maintenance.html',
  styleUrls: ['./maintenance.scss'],
})
export class Maintenance implements OnInit {
  interventions = signal<Intervention[]>([]);
  techniciens = signal<Technicien[]>([]);
  vehicules = signal<Vehicule[]>([]);

  search = signal('');
  isLoading = signal(true);
  error = signal<string | null>(null);
  saving = signal(false);
  modalMode = signal<'create' | 'edit' | null>(null);
  deleteId = signal<string | null>(null);
  toast = signal<{ msg: string; type: 'success' | 'error' } | null>(null);

  form = {
    id: '',
    vehicule_id: '',
    technicien_id: '' as string | null,
    type_intervention: '',
    statut: 'planifie',
    date_planifiee: '',
  };

  statuts = ['planifie', 'en_cours', 'termine', 'annule'];

  filtered = computed(() => {
    const s = this.search().toLowerCase();
    return this.interventions().filter(
      (i) =>
        i.vehicule_id?.toLowerCase().includes(s) ||
        i.type_intervention?.toLowerCase().includes(s) ||
        this.getVehiculeLabel(i.vehicule_id).toLowerCase().includes(s),
    );
  });

  constructor(private readonly maintenanceService: ServiceMaintenance) {}

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.isLoading.set(true);

    // Load techniciens and vehicules for dropdowns
    this.maintenanceService.getVehicules().subscribe({
      next: (data) => this.vehicules.set(data),
      error: () => {},
    });

    this.maintenanceService.getTechniciens().subscribe({
      next: (data) => this.techniciens.set(data),
      error: () => {},
    });

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

  // --- Lookup helpers ---

  getVehiculeLabel(vehiculeId: string): string {
    const v = this.vehicules().find((v) => v.id === vehiculeId);
    return v ? `${v.immatriculation} — ${v.marque} ${v.modele}` : vehiculeId;
  }

  getTechnicienLabel(technicienId?: string | null): string {
    if (!technicienId) return '—';
    const t = this.techniciens().find((t) => t.id === technicienId);
    return t ? `${t.prenom} ${t.nom}` : '—';
  }

  // --- Modal & Form Logic ---

  openCreate() {
    this.form = {
      id: '',
      vehicule_id: '',
      technicien_id: null,
      type_intervention: '',
      statut: 'planifie',
      date_planifiee: '',
    };
    this.modalMode.set('create');
  }

  openEdit(intervention: Intervention) {
    this.form = {
      id: intervention.id,
      vehicule_id: intervention.vehicule_id,
      technicien_id: intervention.technicien_id ?? null,
      type_intervention: intervention.type_intervention,
      statut: intervention.statut,
      date_planifiee: intervention.date_planifiee,
    };
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
    const techId = this.form.technicien_id || null;

    if (this.modalMode() === 'create') {
      this.maintenanceService
        .createIntervention(
          this.form.vehicule_id,
          techId,
          this.form.type_intervention,
          this.form.date_planifiee,
          this.form.statut,
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
      this.maintenanceService
        .updateIntervention(
          this.form.id,
          this.form.vehicule_id,
          techId,
          this.form.type_intervention,
          this.form.date_planifiee,
          this.form.statut,
        )
        .subscribe({
          next: (updated) => {
            this.interventions.update((list) =>
              list.map((i) => (i.id === updated.id ? updated : i)),
            );
            this.showToast('Intervention modifiée avec succès !', 'success');
            this.saving.set(false);
            this.closeModal();
          },
          error: (err) => {
            console.error(err);
            this.showToast('Erreur lors de la modification.', 'error');
            this.saving.set(false);
          },
        });
    }
  }

  // --- Delete Logic ---

  confirmDelete(id: string) {
    this.deleteId.set(id);
  }

  cancelDelete() {
    this.deleteId.set(null);
  }

  doDelete() {
    const id = this.deleteId()!;
    this.maintenanceService.deleteIntervention(id).subscribe({
      next: () => {
        this.interventions.update((list) => list.filter((i) => i.id !== id));
        this.showToast('Intervention supprimée.', 'success');
        this.deleteId.set(null);
      },
      error: () => {
        this.showToast('Erreur lors de la suppression.', 'error');
        this.deleteId.set(null);
      },
    });
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
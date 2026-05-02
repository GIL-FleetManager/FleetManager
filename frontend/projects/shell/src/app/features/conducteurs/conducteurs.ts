import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConducteursService, Conducteur } from './services/conducteurs';

type ModalMode = 'create' | 'edit' | null;

@Component({
  selector: 'app-conducteurs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './conducteurs.html',
  styleUrl: './conducteurs.scss',
})
export class Conducteurs implements OnInit {
  private readonly svc = inject(ConducteursService);

  conducteurs = signal<Conducteur[]>([]);
  isLoading = signal(true);
  error = signal('');
  search = signal('');
  modalMode = signal<ModalMode>(null);
  saving = signal(false);
  deleteId = signal<string | null>(null);

  toast = signal<{ msg: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Initialisation du formulaire
  form: Omit<Conducteur, 'id'> = {
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    numero_permis: '',
    date_expiration_permis: '',
    statut: 'actif',
  };
  editingId: string | null = null;

  statuts: string[] = ['actif', 'inactif', 'en_conge'];

  // Barre de recherche réactive
  filtered = computed(() => {
    const q = this.search().toLowerCase();
    return this.conducteurs().filter(
      (c) =>
        c.nom?.toLowerCase().includes(q) ||
        c.prenom?.toLowerCase().includes(q) ||
        c.numero_permis?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q),
    );
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.svc.getAll().subscribe({
      next: (data) => {
        this.conducteurs.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur GraphQL Conducteurs:', err);
        this.error.set('Erreur lors du chargement des conducteurs via la Gateway');
        this.isLoading.set(false);
      },
    });
  }

  // --- LOGIQUE DES MODALES (Identique aux véhicules) ---

  openCreate(): void {
    this.form = {
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      numero_permis: '',
      date_expiration_permis: '',
      statut: 'actif',
    };
    this.editingId = null;
    this.modalMode.set('create');
  }

  openEdit(c: Conducteur): void {
    this.form = {
      nom: c.nom,
      prenom: c.prenom,
      email: c.email,
      telephone: c.telephone,
      numero_permis: c.numero_permis,
      date_expiration_permis: c.date_expiration_permis,
      statut: c.statut || 'actif',
    };
    this.editingId = c.id!;
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
        this.showToast(isCreate ? 'Conducteur créé ✅' : 'Conducteur modifié ✅', 'success');
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
        this.showToast('Conducteur supprimé', 'success');
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
      actif: 'badge-success',
      inactif: 'badge-danger',
      en_conge: 'badge-warning',
    };
    return m[statut] ?? 'badge-default';
  }
}

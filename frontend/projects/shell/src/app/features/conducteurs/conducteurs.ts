import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConducteursService, Conductor } from './services/conducteurs';

type ModalMode = 'create' | 'edit' | null;

@Component({
  selector: 'app-conducteurs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './conducteurs.html',
  styleUrl: './conducteurs.scss',
})
export class Conducteurs implements OnInit {
  private svc = inject(ConducteursService);

  conducteurs  = signal<Conductor[]>([]);
  isLoading    = signal(true);
  error        = signal('');
  search       = signal('');
  modalMode    = signal<ModalMode>(null);
  saving       = signal(false);
  deleteId     = signal<string | null>(null);
  toast        = signal<{ msg: string; type: 'success' | 'error' } | null>(null);

  editingId: string | null = null;

  form: Omit<Conductor, 'id' | 'createdAt' | 'updatedAt'> = {
    nom: '', prenom: '', email: '', telephone: '',
    numeroPermis: '', dateExpirationPermis: '', statut: 'actif',
  };

  statuts: Conductor['statut'][] = ['actif', 'inactif', 'suspendu'];

  filtered = computed(() => {
    const q = this.search().toLowerCase();
    return this.conducteurs().filter(c =>
      c.nom.toLowerCase().includes(q) ||
      c.prenom.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.numeroPermis ?? '').toLowerCase().includes(q)
    );
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading.set(true);
    this.svc.getAll().subscribe({
      next: (data) => { this.conducteurs.set(data); this.isLoading.set(false); },
      error: () => { this.error.set('Erreur lors du chargement'); this.isLoading.set(false); }
    });
  }

  openCreate(): void {
    this.form = { nom: '', prenom: '', email: '', telephone: '', numeroPermis: '', dateExpirationPermis: '', statut: 'actif' };
    this.editingId = null;
    this.modalMode.set('create');
  }

  openEdit(c: Conductor): void {
    this.form = {
      nom: c.nom, prenom: c.prenom, email: c.email,
      telephone: c.telephone ?? '',
      numeroPermis: c.numeroPermis,
      dateExpirationPermis: c.dateExpirationPermis,
      statut: c.statut,
    };
    this.editingId = c.id!;
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
        this.showToast(this.modalMode() === 'create' ? 'Conducteur créé ✅' : 'Conducteur modifié ✅', 'success');
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
      next: () => { this.showToast('Conducteur supprimé', 'success'); this.deleteId.set(null); this.load(); },
      error: () => { this.showToast('Erreur lors de la suppression', 'error'); this.deleteId.set(null); }
    });
  }

  showToast(msg: string, type: 'success' | 'error'): void {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 3000);
  }

  statutClass(statut: string): string {
    const m: Record<string, string> = {
      actif: 'badge-success', inactif: 'badge-default', suspendu: 'badge-danger',
    };
    return m[statut] ?? 'badge-default';
  }

  isExpiringSoon(date: string): boolean {
    if (!date) return false;
    const exp = new Date(date);
    const diff = (exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff <= 30 && diff >= 0;
  }

  isExpired(date: string): boolean {
    if (!date) return false;
    return new Date(date) < new Date();
  }
}

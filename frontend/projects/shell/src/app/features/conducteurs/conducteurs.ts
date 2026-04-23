import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ConducteursService } from './services/conducteurs';

@Component({
  selector: 'app-conducteurs',
  standalone: true,
  imports: [],
  templateUrl: './conducteurs.html',
  styleUrl: './conducteurs.scss',
})
export class Conducteurs implements OnInit {

  conducteurs: any[] = [];
  isLoading = true;
  error = '';

  constructor(
    private conducteurService: ConducteursService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.conducteurService.getAll().subscribe({
      next: (data) => {
        this.conducteurs = data['member'];
        this.isLoading = false;
        this.cdr.detectChanges(); // ← force la mise à jour
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des conducteurs';
        this.isLoading = false;
        this.cdr.detectChanges();
        console.error(err);
      }
    });
  }

  delete(id: string) {
    if (confirm('Supprimer ce conducteur ?')) {
      this.conducteurService.delete(id).subscribe(() => {
        this.conducteurs = this.conducteurs.filter(c => c.id !== id);
        this.cdr.detectChanges();
      });
    }
  }
}
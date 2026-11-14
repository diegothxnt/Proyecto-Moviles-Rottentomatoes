import { Component, ChangeDetectorRef, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonSearchbar, IonContent, IonSpinner, IonButton, IonIcon,
} from '@ionic/angular';
import { MovieService } from 'src/app/core/services/movie.service';
import { MovieCacheService } from 'src/app/core/services/movie-cache.service';
import { Movie } from 'src/app/core/models/movie.model';
import { MovieCardComponent } from 'src/app/shared/components/movie-card/movie-card.component';
import { addIcons } from 'ionicons';
import { searchOutline, closeCircle } from 'ionicons/icons';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonSearchbar, IonContent, IonSpinner, IonButton, IonIcon,
    MovieCardComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar><ion-title>Buscar</ion-title></ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          [value]="query"
          (ionInput)="onInput($event)"
          (ionClear)="clearSearch()"
          placeholder="Buscar películas o series..."
          searchIcon="search-outline"
          showClearButton="always"
          [debounce]="200"
          class="custom-search">
        </ion-searchbar>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="state" *ngIf="loading && !results.length">
        <ion-spinner name="crescent" color="danger"></ion-spinner>
        <p class="text-secondary">Buscando "{{ query }}"...</p>
      </div>

      <div class="search-results-header" *ngIf="!loading && results.length">
        <span class="text-secondary">
          {{ results.length }} resultado{{ results.length !== 1 ? 's' : '' }} para
        </span>
        <strong>"{{ query }}"</strong>
      </div>

      <div class="grid" *ngIf="results.length">
        <app-movie-card *ngFor="let m of results; trackBy: trackById" [movie]="m"></app-movie-card>
      </div>

      <div class="state" *ngIf="!loading && !results.length && query.length === 0">
        <ion-icon name="search-outline" class="empty-icon"></ion-icon>
        <p class="empty-title">Busca algo</p>
        <p class="empty-sub text-secondary">Escribe al menos 3 caracteres</p>
      </div>

      <div class="state" *ngIf="!loading && !results.length && query.length >= 3">
        <ion-icon name="search-outline" class="empty-icon"></ion-icon>
        <p class="empty-title">Sin resultados</p>
        <p class="empty-sub text-secondary">No encontramos "{{ query }}"</p>
        <ion-button fill="outline" (click)="clearSearch()">
          <ion-icon slot="start" name="close-circle"></ion-icon>
          Limpiar búsqueda
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .custom-search {
      --background: #232323;
      --color: #fff;
      --placeholder-color: #b3b3b3;
      --icon-color: #e50914;
      --border-radius: 8px;
      padding: 4px 8px;
    }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; padding: 16px; }
    .state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 64px 32px;
      text-align: center; gap: 12px;
    }
    .empty-icon { font-size: 64px; color: #5a5a5a; }
    .empty-title { color: #fff; font-size: 18px; font-weight: 700; margin: 0; }
    .empty-sub { font-size: 14px; margin: 0; }
    .search-results-header {
      padding: 16px 16px 8px;
      font-size: 14px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .search-results-header strong { color: #fff; font-size: 16px; font-weight: 700; }
  `],
})
export class SearchPage implements OnDestroy {
  private movieService = inject(MovieService);
  private movieCache = inject(MovieCacheService);
  private cd = inject(ChangeDetectorRef);

  private searchTimer?: ReturnType<typeof setTimeout>;
  private lastQuery = '';

  query = '';
  results: Movie[] = [];
  loading = false;

  constructor() {
    addIcons({ searchOutline, closeCircle });
  }

  ngOnDestroy() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }

  trackById = (_: number, m: Movie) => m._id;

  /* ⚡ FIX: leer event.detail.value directamente */
  onInput(event: any) {
    const value = (event.detail?.value ?? '') as string;
    this.query = value;

    if (this.searchTimer) clearTimeout(this.searchTimer);

    const trimmed = value.trim();

    if (trimmed.length === 0) {
      this.results = [];
      this.loading = false;
      this.cd.detectChanges();
      return;
    }

    if (trimmed.length < 3) {
      this.results = [];
      this.loading = false;
      this.cd.detectChanges();
      return;
    }

    if (trimmed === this.lastQuery) return;

    // debounce 250ms
    this.searchTimer = setTimeout(() => this.performSearch(trimmed), 250);
  }

  private performSearch(value: string) {
    this.lastQuery = value;

    const key = this.movieService.buildListKey({
      q: value,
      type: 'movie',
      sort: 'rating',
      order: 'desc',
    });

    // Cache hit → instantáneo
    const cached = this.movieCache.getList(key);
    if (cached) {
      this.results = cached;
      this.loading = false;
      this.cd.detectChanges();
      return;
    }

    this.loading = true;
    this.cd.detectChanges();

    this.movieService.search({ q: value, limit: 20 }).subscribe({
      next: (res) => {
        this.results = res.data;
        this.loading = false;
        this.cd.detectChanges();  // ⚡ fuerza CD
      },
      error: () => {
        this.results = [];
        this.loading = false;
        this.cd.detectChanges();
      },
    });
  }

  clearSearch() {
    this.query = '';
    this.results = [];
    this.loading = false;
    this.lastQuery = '';
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.cd.detectChanges();
  }
}
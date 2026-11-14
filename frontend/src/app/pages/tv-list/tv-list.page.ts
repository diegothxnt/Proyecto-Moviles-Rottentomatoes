import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonSearchbar, IonSegment,
  IonSegmentButton, IonLabel, IonContent, IonSpinner, IonButton, IonIcon,
  IonButtons, IonChip, IonModal, IonBadge, IonFab, IonFabButton, IonInput,
  ToastController
} from '@ionic/angular';
import { MovieService, SearchParams } from 'src/app/core/services/movie.service';
import { MovieCacheService } from 'src/app/core/services/movie-cache.service';
import { Movie } from 'src/app/core/models/movie.model';
import { MovieCardComponent } from 'src/app/shared/components/movie-card/movie-card.component';
import { addIcons } from 'ionicons';
import {
  searchOutline, closeCircle, timeOutline, trashOutline, arrowBack,
  optionsOutline, star, close,
} from 'ionicons/icons';

type SortOption = 'releaseDate' | 'rating';
type ViewMode = 'browse' | 'search' | 'history';

@Component({
  selector: 'app-tv-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonSearchbar, IonSegment,
    IonSegmentButton, IonLabel, IonContent, IonSpinner, IonButton, IonIcon,
    IonButtons, IonChip, IonModal, IonBadge, IonFab, IonFabButton, IonInput,
    MovieCardComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start" *ngIf="searchOpen || viewMode === 'history'">
          <ion-button (click)="closeSearchOrHistory()">
            <ion-icon name="arrow-back"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>
          {{ viewMode === 'history' ? 'Búsquedas recientes' : 'Series' }}
        </ion-title>
        <ion-buttons slot="end" *ngIf="!searchOpen && viewMode !== 'history'">
          <ion-button (click)="openSearch()">
            <ion-icon slot="icon-only" name="search-outline"></ion-icon>
          </ion-button>
          <ion-button (click)="enterHistory()" [disabled]="!recentSearches.length" title="Recientes">
            <ion-icon slot="icon-only" name="time-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <ion-toolbar *ngIf="searchOpen">
        <ion-searchbar
          [value]="query"
          (ionInput)="onSearchInput($event)"
          (ionClear)="clearSearch()"
          placeholder="Buscar series..."
          searchIcon="search-outline"
          showClearButton="always"
          [debounce]="200"
          [autofocus]="true"
          class="custom-search">
        </ion-searchbar>
      </ion-toolbar>

      <ion-toolbar *ngIf="!searchOpen && viewMode !== 'history'">
        <ion-segment [value]="sort">
          <ion-segment-button value="releaseDate" (click)="setSort('releaseDate')">
            <ion-label>Recientes</ion-label>
          </ion-segment-button>
          <ion-segment-button value="rating" (click)="setSort('rating')">
            <ion-label>Puntaje</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- HISTORIAL -->
      <div *ngIf="viewMode === 'history'" class="history-view">
        <div *ngIf="recentSearches.length; else emptyHistory">
          <p class="history-hint text-secondary">Toca una búsqueda para repetirla</p>
          <div class="history-list">
            <div *ngFor="let s of recentSearches; trackBy: trackByText" class="history-item-wrapper">
              <button class="history-item" (click)="applyRecentSearch(s)">
                <ion-icon name="time-outline" class="history-item-icon"></ion-icon>
                <span class="history-item-text">{{ s }}</span>
                <ion-icon name="arrow-back" class="history-item-arrow"></ion-icon>
              </button>
              <button class="history-delete-btn" (click)="removeOne($event, s)">
                <ion-icon name="trash-outline"></ion-icon>
              </button>
            </div>
          </div>
          <div class="history-actions">
            <ion-button expand="block" fill="outline" color="danger" (click)="clearAllRecent()">
              <ion-icon slot="start" name="trash-outline"></ion-icon>
              Limpiar todo
            </ion-button>
          </div>
        </div>
        <ng-template #emptyHistory>
          <div class="state">
            <ion-icon name="time-outline" class="empty-icon"></ion-icon>
            <p class="empty-title">Sin búsquedas recientes</p>
            <p class="empty-sub text-secondary">Tus búsquedas de series aparecerán aquí</p>
          </div>
        </ng-template>
      </div>

      <!-- VISTA PRINCIPAL -->
      <div *ngIf="viewMode !== 'history'">
        <div class="active-filters" *ngIf="activeFiltersCount > 0">
          <ion-chip class="active-chip" *ngIf="activeGenre" (click)="setGenre('')">
            {{ activeGenre }} <ion-icon name="close"></ion-icon>
          </ion-chip>
          <ion-chip class="active-chip" *ngIf="activeMinRating > 0" (click)="setMinRating(0)">
            <ion-icon name="star" style="font-size: 12px;"></ion-icon>
            {{ activeMinRating }}+ <ion-icon name="close"></ion-icon>
          </ion-chip>
          <ion-chip class="active-chip" *ngIf="activeYear > 0" (click)="setYear(0)">
            Año: {{ activeYear }} <ion-icon name="close"></ion-icon>
          </ion-chip>
          <ion-chip class="active-chip" *ngIf="sort !== 'releaseDate'" (click)="setSort('releaseDate')">
            Puntaje <ion-icon name="close"></ion-icon>
          </ion-chip>
          <button class="clear-filters" (click)="resetFilters()">Limpiar</button>
        </div>

        <div class="search-header" *ngIf="searchOpen && query.length >= 3 && series.length">
          <strong>{{ series.length }} resultados</strong>
          <span class="text-secondary">para "{{ query }}"</span>
        </div>

        <div class="state" *ngIf="loading && !series.length">
          <ion-spinner name="crescent" color="danger"></ion-spinner>
          <p class="text-secondary">{{ searchOpen ? 'Buscando...' : 'Cargando...' }}</p>
        </div>

        <div class="grid" *ngIf="series.length">
          <app-movie-card *ngFor="let m of series; trackBy: trackById" [movie]="m"></app-movie-card>
        </div>

        <div class="state" *ngIf="!loading && !series.length">
          <ion-icon name="search-outline" class="empty-icon"></ion-icon>
          <p class="empty-title">Sin resultados</p>
          <p class="empty-sub text-secondary">
            {{ searchOpen ? 'No encontramos "' + query + '"' : 'No hay series' }}
          </p>
        </div>
      </div>

      <ion-fab *ngIf="viewMode !== 'history'" vertical="bottom" horizontal="end" slot="fixed" class="filter-fab">
        <ion-fab-button (click)="showFilters = true" [color]="activeFiltersCount > 0 ? 'danger' : 'dark'">
          <ion-icon name="options-outline"></ion-icon>
          <ion-badge *ngIf="activeFiltersCount > 0" color="light">{{ activeFiltersCount }}</ion-badge>
        </ion-fab-button>
      </ion-fab>
    </ion-content>

    <!-- MODAL DE FILTROS -->
    <ion-modal [isOpen]="showFilters" (didDismiss)="showFilters = false"
      [initialBreakpoint]="0.75" [breakpoints]="[0, 0.75, 1]" [handle]="true">
      <ng-template>
        <ion-content class="filter-modal">
          <div class="filter-header">
            <h2>Filtros</h2>
            <ion-button fill="clear" color="danger" size="small" (click)="resetFilters()">Restablecer</ion-button>
          </div>
          <section class="filter-section">
            <h3>Ordenar por</h3>
            <div class="chips-wrap">
              <ion-chip [class.active]="sort === 'releaseDate'" (click)="setSort('releaseDate')">Más recientes</ion-chip>
              <ion-chip [class.active]="sort === 'rating'" (click)="setSort('rating')">Mejor puntuadas</ion-chip>
            </div>
          </section>

          <section class="filter-section">
            <h3>Año de estreno</h3>
            <p style="color: #808080; font-size: 11px; margin: 0 0 8px 0;">
              Rango válido: {{ minYear }} (serie más antigua) hasta {{ currentYear + 2 }}
            </p>
            <ion-input
              type="number"
              [(ngModel)]="yearInput"
              placeholder="Ej: 2023"
              fill="outline"
              style="--background: #1a1a1a; --color: #fff; --border-radius: 8px; margin-bottom: 8px;"
              [min]="minYear"
              [max]="currentYear + 2">
            </ion-input>
            <ion-button expand="block" fill="outline" color="light" size="small" (click)="setYear(yearInput)">
              Aplicar año
            </ion-button>
          </section>

          <section class="filter-section">
            <h3>Puntuación mínima</h3>
            <div class="chips-wrap">
              <ion-chip *ngFor="let r of ratingFilters" [class.active]="activeMinRating === r.value" (click)="setMinRating(r.value)">
                <ion-icon *ngIf="r.value > 0" name="star" style="font-size: 12px; margin-right: 2px;"></ion-icon>
                {{ r.label }}
              </ion-chip>
            </div>
          </section>
          <section class="filter-section" *ngIf="availableGenres.length">
            <h3>Género</h3>
            <div class="chips-wrap">
              <ion-chip *ngFor="let g of availableGenres" [class.active]="activeGenre === g.value" (click)="setGenre(g.value)">
                {{ g.label }}
              </ion-chip>
            </div>
          </section>
          <ion-button expand="block" class="apply-btn" (click)="showFilters = false">Ver resultados</ion-button>
        </ion-content>
      </ng-template>
    </ion-modal>
  `,
  styles: [`
    .custom-search { --background: #1a1a1a; --color: #fff; --placeholder-color: #808080; --icon-color: #e50914; --border-radius: 10px; padding: 4px 8px; }
    ion-segment { --background: #0a0a0a; padding: 0 8px; }
    ion-segment-button { --color: #808080; --color-checked: #fff; --indicator-color: #e50914; font-size: 13px; }

    .active-filters { display: flex; gap: 8px; padding: 12px 16px 4px; overflow-x: auto; align-items: center; }
    .active-filters::-webkit-scrollbar { display: none; }
    .active-chip { --background: rgba(229,9,20,0.15); --color: #e50914; border: 1px solid #e50914; flex-shrink: 0; margin: 0; font-size: 12px; height: 28px; }
    .active-chip ion-icon { margin-left: 4px; font-size: 14px; }
    .clear-filters { background: transparent; color: #808080; border: none; font-size: 12px; padding: 4px 8px; flex-shrink: 0; cursor: pointer; text-decoration: underline; }

    .search-header { display: flex; gap: 6px; padding: 16px 16px 4px; font-size: 14px; align-items: baseline; }
    .search-header strong { color: #fff; font-weight: 700; }

    .history-view { padding: 16px; }
    .history-hint { font-size: 13px; margin: 0 0 16px; padding: 0 4px; }
    .history-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
    .history-item-wrapper { display: flex; gap: 8px; }
    .history-item { flex: 1; display: flex; align-items: center; gap: 12px; background: #1a1a1a; border: 1px solid #232323; border-radius: 10px; padding: 14px 16px; cursor: pointer; text-align: left; color: #fff; font-family: inherit; font-size: 15px; }
    .history-item:active { background: #2a2a2a; }
    .history-item-icon { color: #808080; font-size: 18px; flex-shrink: 0; }
    .history-item-text { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .history-item-arrow { color: #5a5a5a; font-size: 16px; transform: rotate(180deg); }
    .history-delete-btn { width: 44px; background: #1a1a1a; border: 1px solid #232323; border-radius: 10px; color: #e50914; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .history-delete-btn:active { background: rgba(229,9,20,0.15); }
    .history-actions { padding-top: 12px; border-top: 1px solid #232323; }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
      padding: 16px 16px 100px;
      box-sizing: border-box;
      width: 100%;
    }

    .state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 32px; text-align: center; gap: 12px; }
    .empty-icon { font-size: 64px; color: #333; }
    .empty-title { color: #fff; font-size: 18px; font-weight: 700; margin: 0; }
    .empty-sub { font-size: 14px; margin: 0; }

    .filter-fab { bottom: calc(72px + env(safe-area-inset-bottom, 0px)); right: 16px; }
    .filter-fab ion-fab-button { --border-radius: 16px; --box-shadow: 0 6px 24px rgba(0,0,0,0.6); width: 56px; height: 56px; }
    .filter-fab ion-badge { position: absolute; top: -4px; right: -4px; font-size: 10px; padding: 2px 6px; border-radius: 10px; }

    .filter-modal { --background: #0a0a0a; }
    .filter-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 24px 0; }
    .filter-header h2 { color: #fff; font-size: 22px; font-weight: 800; margin: 0; }
    .filter-section { padding: 20px 24px; }
    .filter-section h3 { color: #808080; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 12px; }
    .chips-wrap { display: flex; flex-wrap: wrap; gap: 8px; }
    .chips-wrap ion-chip { --background: #1a1a1a; --color: #b3b3b3; border: 1px solid #2d2d2d; font-size: 13px; height: 34px; margin: 0; cursor: pointer; }
    .chips-wrap ion-chip.active { --background: #e50914; --color: #fff; border-color: #e50914; font-weight: 600; }
    .apply-btn { --background: #e50914; --color: #fff; --border-radius: 10px; margin: 24px; font-weight: 700; }
  `],
})
export class TvListPage implements OnInit, OnDestroy {
  private movieService = inject(MovieService);
  private movieCache = inject(MovieCacheService);
  private cd = inject(ChangeDetectorRef);
  private toastCtrl = inject(ToastController);

  private searchTimer?: ReturnType<typeof setTimeout>;

  // ⚡ Contador de petición: garantiza que solo la última respuesta se aplique
  private requestIdCounter = 0;

  readonly type: 'tv' = 'tv';
  series: Movie[] = [];
  query = '';
  sort: SortOption = 'releaseDate';
  activeGenre = '';
  activeMinRating = 0;
  activeYear = 0;
  yearInput: number | null = null;
  loading = false;
  searchOpen = false;
  viewMode: ViewMode = 'browse';
  showFilters = false;
  availableGenres: { label: string; value: string }[] = [];

  currentYear = new Date().getFullYear();
  minYear = 1888;

  ratingFilters = [
    { label: 'Todas', value: 0 }, { label: '6+', value: 6 },
    { label: '7+', value: 7 }, { label: '8+', value: 8 }, { label: '9+', value: 9 },
  ];

  get recentSearches(): string[] { return this.movieCache.getRecentSearches('tv'); }

  get activeFiltersCount(): number {
    let n = 0;
    if (this.activeGenre) n++;
    if (this.activeMinRating > 0) n++;
    if (this.activeYear > 0) n++;
    if (this.sort !== 'releaseDate') n++;
    return n;
  }

  constructor() {
    addIcons({ searchOutline, closeCircle, timeOutline, trashOutline, arrowBack, optionsOutline, star, close });
  }

  ngOnInit() {
    this.loadGenres();
    this.loadBrowse();

    this.movieService.getOldestYear('tv').subscribe({
      next: (res) => {
        this.minYear = res.data;
        this.cd.detectChanges();
      },
      error: () => { this.minYear = 1888; }
    });
  }

  ngOnDestroy() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }

  trackById = (_: number, m: Movie) => m._id;
  trackByText = (_: number, s: string) => s;

  setSort(value: SortOption) {
    if (this.sort === value) return;
    this.sort = value;
    this.refresh();
  }

  setGenre(value: string) {
    if (this.activeGenre === value) return;
    this.activeGenre = value;
    this.refresh();
  }

  setMinRating(value: number) {
    if (this.activeMinRating === value) return;
    this.activeMinRating = value;
    this.refresh();
  }

  async setYear(value: number | null) {
    if (!value) {
      this.activeYear = 0;
      this.refresh();
      return;
    }

    const year = Number(value);

    if (year < this.minYear) {
      const t = await this.toastCtrl.create({
        message: `La serie más antigua disponible es de ${this.minYear}.`,
        duration: 3000, color: 'warning', position: 'top'
      });
      t.present();
      this.yearInput = null;
      return;
    }

    if (year > this.currentYear + 2) {
      const t = await this.toastCtrl.create({
        message: 'Ese año aún no ha llegado a la televisión.',
        duration: 3000, color: 'warning', position: 'top'
      });
      t.present();
      this.yearInput = null;
      return;
    }

    if (this.activeYear === year) return;
    this.activeYear = year;
    this.refresh();
  }

  resetFilters() {
    this.activeGenre = '';
    this.activeMinRating = 0;
    this.activeYear = 0;
    this.yearInput = null;
    this.sort = 'releaseDate';
    this.refresh();
  }

  openSearch() {
    this.searchOpen = true;
    this.viewMode = 'browse';
    this.cd.detectChanges();
  }

  closeSearchOrHistory() {
    if (this.searchOpen) {
      this.searchOpen = false;
      this.query = '';
      this.loadBrowse();
    } else {
      this.viewMode = 'browse';
      this.loadBrowse();
    }
  }

  onSearchInput(event: any) {
    const value = (event.detail?.value ?? '') as string;
    this.query = value;
    if (this.searchTimer) clearTimeout(this.searchTimer);
    const trimmed = value.trim();
    if (trimmed.length === 0) { this.loadBrowse(); return; }
    if (trimmed.length < 3) {
      this.series = [];
      this.loading = false;
      this.cd.detectChanges();
      return;
    }
    this.searchTimer = setTimeout(() => this.performSearch(trimmed), 300);
  }

    private filterResults(movies: any[]): any[] {
    let filtered = movies;

    // ⚡ FILTRO ULTRA ESTRICTO DE AÑO
    if (this.activeYear > 0) {
      const yearTarget = this.activeYear;
      filtered = filtered.filter(m => {
        if (!m.releaseDate) {
          console.warn('⚠️ Película sin fecha:', m.title);
          return false;
        }
        // Convertir a año de cualquier formato de fecha
        const releaseYear = new Date(m.releaseDate).getUTCFullYear();
        const matches = releaseYear === yearTarget;
        if (!matches) {
          console.warn(`❌ Descartada: "${m.title}" es de ${releaseYear}, no de ${yearTarget}`);
        }
        return matches;
      });
      console.log(`✅ Filtro año ${yearTarget}: ${filtered.length} de ${movies.length} películas`);
    }

    if (this.activeMinRating > 0) {
      filtered = filtered.filter(m => {
        const global = m.ratings?.globalAverage ?? 0;
        const external = m.externalRating ?? 0;
        const displayRating = global > 0 ? global : external;
        return displayRating >= this.activeMinRating;
      });
    }

    return filtered;
  }

  private performSearch(value: string) {
    const myRequestId = ++this.requestIdCounter;
    const yearAtRequest = this.activeYear;
    const genreAtRequest = this.activeGenre;
    const ratingAtRequest = this.activeMinRating;
    const sortAtRequest = this.sort;

    const params: SearchParams = {
      q: value, type: this.type, sort: this.sort, order: 'desc',
      genre: this.activeGenre || undefined,
      minRating: this.activeMinRating > 0 ? this.activeMinRating : undefined,
      year: this.activeYear > 0 ? this.activeYear : undefined,
      limit: 50,
    };

    this.movieCache.addRecentSearch(value, 'tv');
    this.loading = true;
    this.cd.detectChanges();

    this.movieService.search(params).subscribe({
      next: (res) => {
        if (myRequestId !== this.requestIdCounter) {
          console.log('⏭️ Respuesta ignorada (hay una petición más nueva en curso)');
          return;
        }
        if (
          yearAtRequest !== this.activeYear ||
          genreAtRequest !== this.activeGenre ||
          ratingAtRequest !== this.activeMinRating ||
          sortAtRequest !== this.sort
        ) {
          console.log('⏭️ Respuesta ignorada (filtros cambiaron durante la petición)');
          return;
        }

        this.series = this.filterResults(res.data);
        this.loading = false;
        this.cd.detectChanges();
      },
      error: () => {
        if (myRequestId !== this.requestIdCounter) return;
        this.series = [];
        this.loading = false;
        this.cd.detectChanges();
      },
    });
  }

  clearSearch() {
    this.query = '';
    this.loadBrowse();
  }

  enterHistory() {
    this.viewMode = 'history';
    this.searchOpen = false;
    this.query = '';
    this.cd.detectChanges();
  }

  applyRecentSearch(text: string) {
    this.query = text;
    this.searchOpen = true;
    this.viewMode = 'browse';
    this.performSearch(text);
  }

  removeOne(event: Event, text: string) {
    event.stopPropagation();
    this.movieCache.removeRecentSearch(text, 'tv');
    this.cd.detectChanges();
  }

  clearAllRecent() {
    this.movieCache.clearRecentSearches('tv');
    this.cd.detectChanges();
  }

  private refresh() {
    if (this.searchOpen && this.query.trim().length >= 3) {
      this.performSearch(this.query.trim());
    } else {
      this.loadBrowse();
    }
  }

  private loadGenres() {
    this.movieService.getGenres(this.type).subscribe({
      next: (res) => {
        this.availableGenres = [
          { label: 'Todos', value: '' },
          ...res.data.slice(0, 15).map((g) => ({ label: g, value: g }))
        ];
        this.cd.detectChanges();
      },
      error: () => {},
    });
  }

  loadBrowse() {
    const myRequestId = ++this.requestIdCounter;
    const yearAtRequest = this.activeYear;
    const genreAtRequest = this.activeGenre;
    const ratingAtRequest = this.activeMinRating;
    const sortAtRequest = this.sort;

    const params: SearchParams = {
      type: this.type, sort: this.sort, order: 'desc',
      genre: this.activeGenre || undefined,
      minRating: this.activeMinRating > 0 ? this.activeMinRating : undefined,
      year: this.activeYear > 0 ? this.activeYear : undefined,
      limit: 50,
    };

    this.loading = true;
    this.cd.detectChanges();

    this.movieService.search(params).subscribe({
      next: (res) => {
        if (myRequestId !== this.requestIdCounter) {
          console.log('⏭️ Respuesta ignorada (hay una petición más nueva en curso)');
          return;
        }
        if (
          yearAtRequest !== this.activeYear ||
          genreAtRequest !== this.activeGenre ||
          ratingAtRequest !== this.activeMinRating ||
          sortAtRequest !== this.sort
        ) {
          console.log('⏭️ Respuesta ignorada (filtros cambiaron durante la petición)');
          return;
        }

        this.series = this.filterResults(res.data);
        this.loading = false;
        this.cd.detectChanges();
      },
      error: () => {
        if (myRequestId !== this.requestIdCounter) return;
        this.series = [];
        this.loading = false;
        this.cd.detectChanges();
      },
    });
  }
}
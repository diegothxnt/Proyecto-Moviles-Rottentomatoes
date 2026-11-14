import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Movie } from 'src/app/core/models/movie.model';
import { MovieCacheService } from 'src/app/core/services/movie-cache.service';

@Component({
  selector: 'app-movie-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <a [routerLink]="['/movie', movie._id]" (click)="onClick()" class="card">
      <div class="poster-wrap">
        <img [src]="movie.posterPath || getFallbackImage(movie.title)"
             (error)="movie.posterPath = getFallbackImage(movie.title)"
             [alt]="movie.title" loading="lazy" />
        <div class="score" [ngClass]="scoreClass" *ngIf="scoreLabel">
          {{ scoreLabel }}
        </div>
      </div>
      <div class="meta">
        <h3 class="title">{{ movie.title }}</h3>
        <p class="year">{{ (movie.releaseDate | date:'yyyy':'UTC') || 'N/A' }}</p>
      </div>
    </a>
  `,
  styles: [`
    /* ⚡ FIX RESPONSIVE: Forzamos a que la tarjeta no se estire */
    .card { 
      display: block; 
      text-decoration: none; 
      color: inherit; 
      width: 100%; 
      max-width: 100%;
      overflow: hidden;
      box-sizing: border-box;
    }
    
    .poster-wrap { 
      position: relative; 
      aspect-ratio: 2/3; 
      border-radius: 8px; 
      overflow: hidden; 
      background: #232323; 
      width: 100%;
    }
    
    img { 
      width: 100%; 
      height: 100%; 
      object-fit: cover; 
      display: block; 
    }
    
    .score { 
      position: absolute; 
      top: 8px; 
      right: 8px; 
      background: rgba(0,0,0,0.85); 
      color: #fff; 
      font-weight: 900; 
      font-size: 11px; 
      padding: 4px 8px; 
      border-radius: 4px; 
      border: 1px solid #e50914; 
      backdrop-filter: blur(4px); 
    }
    
    .score.fresh { border-color: #46d369; color: #46d369; }
    .score.rotten { border-color: #e50914; color: #e50914; }
    .score.imdb { border-color: #f5c518; color: #f5c518; }
    
    .meta { padding: 8px 4px 0; }
    .title { font-size: 14px; font-weight: 600; color: #fff; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .year { font-size: 12px; color: #b3b3b3; margin: 2px 0 0; }
  `],
})
export class MovieCardComponent {
  @Input({ required: true }) movie!: Movie;
  private cache = inject(MovieCacheService);

  onClick() { this.cache.setMovie(this.movie); }

  getFallbackImage(title: string): string {
    const cleanTitle = encodeURIComponent(title || 'Sin Título');
    return `https://placehold.co/300x450/1a1a1a/ffffff?text=${cleanTitle}`;
  }

  get scoreLabel(): string {
    const global = this.movie.ratings?.globalAverage ?? 0;
    if (global > 0) return global.toFixed(1);
    if (this.movie.externalRating > 0) return `IMDb ${this.movie.externalRating.toFixed(1)}`;
    return '';
  }
  
  get scoreClass(): string {
    const global = this.movie.ratings?.globalAverage ?? 0;
    if (global > 0) return global >= 6 ? 'fresh' : 'rotten';
    if (this.movie.externalRating > 0) return 'imdb';
    return '';
  }
}
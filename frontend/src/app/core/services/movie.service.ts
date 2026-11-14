import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { timeout } from 'rxjs/operators';
import { tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Movie, MovieDetail } from '../models/movie.model';
import { MovieCacheService } from './movie-cache.service';

export interface SearchParams {
  q?: string;
  genre?: string;
  type?: 'movie' | 'tv';
  sort?: 'releaseDate' | 'rating';
  order?: 'asc' | 'desc';
  minRating?: number;
  year?: number;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class MovieService {
  private http = inject(HttpClient);
  private cache = inject(MovieCacheService);

  // ⚡ SIN CACHÉ DE LISTAS: cada cambio de filtro pide datos frescos al backend
  search(params: SearchParams = {}) {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        httpParams = httpParams.set(k, String(v));
      }
    });

    return this.http
      .get<{ data: Movie[] }>(`${environment.apiUrl}/movies`, { params: httpParams })
      .pipe(timeout(20000));
  }

  getById(id: string) {
    return this.http
      .get<{ data: MovieDetail }>(`${environment.apiUrl}/movies/${id}`)
      .pipe(
        timeout(15000),
        tap((res) => this.cache.setDetail(res.data))
      );
  }

  getGenres(type?: 'movie' | 'tv') {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    return this.http.get<{ data: string[] }>(`${environment.apiUrl}/movies/genres`, { params });
  }

  getOldestYear(type?: 'movie' | 'tv') {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    return this.http.get<{ data: number }>(`${environment.apiUrl}/movies/oldest`, { params });
  }
}
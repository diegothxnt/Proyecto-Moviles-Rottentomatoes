import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Review } from '../models/movie.model';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private http = inject(HttpClient);

  create(payload: { movieId: string; rating?: number; comment: string; parent?: string }) {
    return this.http.post<{ data: Review }>(`${environment.apiUrl}/reviews`, payload);
  }

  update(id: string, payload: { rating?: number; comment?: string }) {
    return this.http.patch<{ data: Review }>(`${environment.apiUrl}/reviews/${id}`, payload);
  }

  remove(id: string) {
    return this.http.delete(`${environment.apiUrl}/reviews/${id}`);
  }

  toggleLike(id: string) {
    return this.http.post<{ data: Review }>(`${environment.apiUrl}/reviews/${id}/like`, {});
  }
}
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthResponse, User } from '../models/user.model';
import { TokenStorageService } from './token-storage.service';
import { MovieCacheService } from './movie-cache.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private tokenStorage = inject(TokenStorageService);
  private movieCache = inject(MovieCacheService);

  private currentUser$ = new BehaviorSubject<User | null>(null);
  readonly user$ = this.currentUser$.asObservable();

  register(payload: { name: string; email: string; password: string }) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, payload).pipe(tap((res) => this.handleAuthSuccess(res)));
  }

  login(payload: { email: string; password: string }) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, payload).pipe(tap((res) => this.handleAuthSuccess(res)));
  }

  me() {
    return this.http.get<{ data: User }>(`${environment.apiUrl}/users/me`).pipe(tap((res) => this.currentUser$.next(res.data)));
  }

  updateProfile(payload: Partial<Pick<User, 'name' | 'avatar' | 'bio' | 'country' | 'favoriteGenre' | 'website'>>) {
    return this.http.patch<{ data: User }>(`${environment.apiUrl}/users/me`, payload).pipe(tap((res) => this.currentUser$.next(res.data)));
  }

  toggleMoviePreference(movieId: string, action: 'like' | 'dislike') {
    return this.http.post<{ success: boolean }>(`${environment.apiUrl}/users/me/preference`, { movieId, action }).pipe(
      tap(() => {
        // Recargamos el perfil para actualizar las listas
        this.me().subscribe();
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.patch<{ success: boolean; message: string }>(`${environment.apiUrl}/users/me/password`, { currentPassword, newPassword });
  }

  deleteAccount(password: string) {
    return this.http.request('delete', `${environment.apiUrl}/users/me`, { body: { password } });
  }

  logout() {
    return this.tokenStorage.clear().then(() => {
      this.movieCache.clear();
      this.movieCache.clearAllRecentSearches();
      this.currentUser$.next(null);
      this.router.navigateByUrl('/auth', { replaceUrl: true });
    });
  }

  get snapshot(): User | null {
    return this.currentUser$.value;
  }

  private async handleAuthSuccess(res: AuthResponse) {
    await this.tokenStorage.setTokens(res.data.accessToken, res.data.refreshToken);
    this.currentUser$.next(res.data.user);
  }
}
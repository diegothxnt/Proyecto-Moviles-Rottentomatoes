import { Injectable, inject } from '@angular/core';
import {
  HttpEvent, HttpHandler, HttpInterceptor, HttpRequest,
  HttpErrorResponse, HttpClient,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, from, switchMap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TokenStorageService } from '../services/token-storage.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private tokenStorage = inject(TokenStorageService);
  private router = inject(Router);
  private http = inject(HttpClient);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const skipAuth =
      req.url.includes('/auth/login') ||
      req.url.includes('/auth/register') ||
      req.url.includes('/auth/refresh');

    if (skipAuth) return next.handle(req);

    return from(this.tokenStorage.getAccessToken()).pipe(
      switchMap((token) => {
        const authReq = token
          ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
          : req;

        return next.handle(authReq).pipe(
          catchError((err: HttpErrorResponse) => {
            if (err.status === 401 && token) return this.refreshAndRetry(req, next);
            return throwError(() => err);
          })
        );
      })
    );
  }

  private refreshAndRetry(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return from(this.tokenStorage.getRefreshToken()).pipe(
      switchMap((refreshToken) => {
        if (!refreshToken) return this.forceLogout();

        return this.http
          .post<{ data: { accessToken: string; refreshToken: string } }>(
            `${environment.apiUrl}/auth/refresh`,
            { refreshToken }
          )
          .pipe(
            switchMap((res) => {
              return from(
                this.tokenStorage.setTokens(res.data.accessToken, res.data.refreshToken)
              ).pipe(
                switchMap(() => {
                  const retried = req.clone({
                    setHeaders: { Authorization: `Bearer ${res.data.accessToken}` },
                  });
                  return next.handle(retried);
                })
              );
            }),
            catchError((err) => {
              // ⚡ EL FIX: Solo cerrar sesión si el refresh token es INVÁLIDO (401)
              // Si falla la red (status 0) o el servidor (500), NO cerrar sesión.
              if (err.status === 401 || err.status === 403) {
                return this.forceLogout();
              }
              return throwError(() => err);
            })
          );
      })
    );
  }

  private forceLogout(): Observable<never> {
    this.tokenStorage.clear();
    this.router.navigateByUrl('/auth', { replaceUrl: true }); // ⚡ Ruta corregida
    return throwError(() => new Error('Session expired'));
  }
}
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenStorageService } from '../services/token-storage.service';

export const authGuard: CanActivateFn = async () => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);
  const token = await tokenStorage.getAccessToken();
  if (token) return true;
  router.navigateByUrl('/auth', { replaceUrl: true });
  return false;
};

export const guestGuard: CanActivateFn = async () => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);
  const token = await tokenStorage.getAccessToken();
  if (!token) return true;
  router.navigateByUrl('/tabs/movies', { replaceUrl: true });
  return false;
};
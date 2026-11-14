import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

const ACCESS_KEY = 'rt_access_token';
const REFRESH_KEY = 'rt_refresh_token';
const PAUSED_KEY = 'rt_app_paused';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  async setTokens(access: string, refresh: string): Promise<void> {
    await Preferences.set({ key: ACCESS_KEY, value: access });
    await Preferences.set({ key: REFRESH_KEY, value: refresh });
  }

  async getAccessToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: ACCESS_KEY });
    return value;
  }

  async getRefreshToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: REFRESH_KEY });
    return value;
  }

  async clear(): Promise<void> {
    await Preferences.remove({ key: ACCESS_KEY });
    await Preferences.remove({ key: REFRESH_KEY });
    await Preferences.remove({ key: PAUSED_KEY });
  }

  async setAppPaused(paused: boolean) {
    await Preferences.set({ key: PAUSED_KEY, value: paused ? '1' : '0' });
  }

  async wasAppKilled(): Promise<boolean> {
    const { value } = await Preferences.get({ key: PAUSED_KEY });
    return value === '1';
  }
}
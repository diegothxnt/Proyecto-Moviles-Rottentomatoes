import { Injectable } from '@angular/core';
import { Movie, MovieDetail } from '../models/movie.model';

interface ListEntry {
  data: Movie[];
  timestamp: number;
}

type HistoryType = 'movie' | 'tv';

@Injectable({ providedIn: 'root' })
export class MovieCacheService {
  private moviesById = new Map<string, Movie>();
  private detailsById = new Map<string, MovieDetail>();
  private listsByKey = new Map<string, ListEntry>();
  private TTL = 5 * 60 * 1000;

  private RECENT_KEY = 'rt_recent_searches_v2';
  private MAX_RECENT = 8;
  private recentByType: Record<HistoryType, string[]> = { movie: [], tv: [] };

  constructor() {
    this.loadRecentFromStorage();
  }

  setMovie(movie: Movie) {
    this.moviesById.set(movie._id, movie);
    for (const entry of this.listsByKey.values()) {
      const idx = entry.data.findIndex((m) => m._id === movie._id);
      if (idx >= 0) {
        entry.data[idx] = { ...entry.data[idx], ...movie } as Movie;
      }
    }
  }

  getMovie(id: string): Movie | undefined {
    return this.moviesById.get(id);
  }

  setDetail(detail: MovieDetail) {
    this.detailsById.set(detail._id, detail);
    this.setMovie(detail);
  }

  getDetail(id: string): MovieDetail | undefined {
    return this.detailsById.get(id);
  }

  invalidateDetail(id: string) {
    this.detailsById.delete(id);
  }

  getList(key: string): Movie[] | null {
    const entry = this.listsByKey.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.TTL) {
      this.listsByKey.delete(key);
      return null;
    }
    return entry.data;
  }

  setList(key: string, data: Movie[]) {
    this.listsByKey.set(key, { data, timestamp: Date.now() });
    data.forEach((m) => this.moviesById.set(m._id, m));
  }

  invalidateList(key: string) {
    this.listsByKey.delete(key);
  }

  clear() {
    this.moviesById.clear();
    this.detailsById.clear();
    this.listsByKey.clear();
  }

  private loadRecentFromStorage() {
    try {
      const raw = localStorage.getItem(this.RECENT_KEY);
      if (raw) this.recentByType = JSON.parse(raw);
    } catch {
      this.recentByType = { movie: [], tv: [] };
    }
  }

  private persist() {
    localStorage.setItem(this.RECENT_KEY, JSON.stringify(this.recentByType));
  }

  addRecentSearch(text: string, type: HistoryType) {
    const clean = (text || '').trim();
    if (clean.length < 3) return;
    const current = this.recentByType[type] || [];
    this.recentByType[type] = [
      clean,
      ...current.filter((s) => s.toLowerCase() !== clean.toLowerCase()),
    ].slice(0, this.MAX_RECENT);
    this.persist();
  }

  getRecentSearches(type: HistoryType): string[] {
    return [...(this.recentByType[type] || [])];
  }

  removeRecentSearch(text: string, type: HistoryType) {
    const clean = (text || '').trim().toLowerCase();
    this.recentByType[type] = (this.recentByType[type] || []).filter(
      (s) => s.toLowerCase() !== clean
    );
    this.persist();
  }

  clearRecentSearches(type: HistoryType) {
    this.recentByType[type] = [];
    this.persist();
  }

  // ⚡ MÉTODO AÑADIDO PARA EVITAR EL ERROR DE COMPILACIÓN
  clearAllRecentSearches() {
    this.recentByType = { movie: [], tv: [] };
    localStorage.removeItem(this.RECENT_KEY);
  }
}
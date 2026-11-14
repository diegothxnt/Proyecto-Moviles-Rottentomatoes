export interface Ratings {
  publicAverage: number;
  publicCount: number;
  criticAverage: number;
  criticCount: number;
  globalAverage: number;
  totalReviews: number;
}

export interface Movie {
  _id: string;
  externalId: string;
  type: 'movie' | 'tv';
  title: string;
  overview: string;
  releaseDate?: string;
  genres: string[];
  posterPath: string;
  backdropPath: string;
  cast: string[];
  externalRating: number;
  runtime: number;
  tagline?: string;
  trailerUrl?: string;
  ratings?: Ratings;
}

export interface Review {
  _id: string;
  user: { _id: string; name: string; avatar?: string; role: string; bio?: string; country?: string; favoriteGenre?: string; website?: string; createdAt?: string };
  movie: string;
  parent?: string | null;
  parentUser?: string | null; // ⚡ NUEVO
  rating: number;
  comment: string;
  likes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MovieDetail extends Movie {
  reviews: Review[];
  userPreference?: 'like' | 'dislike' | null;
}
export interface Movie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  rating?: number;
}

export interface MovieResponse {
  results: Movie[];
  total_pages: number;
  total_results: number;
  page: number;
}

export interface Genre {
  id: number;
  name: string;
}

export interface GenresResponse {
  genres: Genre[];
}

export interface GuestSession {
  guest_session_id: string;
  expires_at: string;
}

export interface RatingResponse {
  status_code: number;
  status_message: string;
}

export interface RatedMovie extends Movie {
  rating: number;
  rated_at: string;
}

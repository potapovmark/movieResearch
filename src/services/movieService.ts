import { API_CONFIG } from '@/config/api';
import { MovieResponse, GenresResponse } from '@/types/movie';

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout exceeded');
    }
    throw error;
  }
}

export async function searchMovies(
  query: string,
  page: number = 1
): Promise<MovieResponse> {
  const url = `${API_CONFIG.BASE_URL}/search/movie?query=${encodeURIComponent(
    query
  )}&page=${page}`;

  const response = await fetchWithTimeout(url, {
    headers: {
      Authorization: `Bearer ${API_CONFIG.BEARER_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

export async function getMoviesByKeyword(
  keyword: string,
  page: number = 1
): Promise<MovieResponse> {
  return searchMovies(keyword, page);
}

export async function getGenres(): Promise<GenresResponse> {
  const url = `${API_CONFIG.BASE_URL}/genre/movie/list`;

  const response = await fetchWithTimeout(url, {
    headers: {
      Authorization: `Bearer ${API_CONFIG.BEARER_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

export async function getPopularMovies(
  page: number = 1
): Promise<MovieResponse> {
  const url = `${API_CONFIG.BASE_URL}/movie/popular?page=${page}`;

  const response = await fetchWithTimeout(url, {
    headers: {
      Authorization: `Bearer ${API_CONFIG.BEARER_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

export async function createGuestSession(): Promise<{ guest_session_id: string }> {
  const sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  localStorage.setItem('guest_session_id', sessionId);

  console.log('Guest session created:', { guest_session_id: sessionId });

  return { guest_session_id: sessionId };
}

export async function getRatedMovies(
  sessionId: string,
  page: number = 1
): Promise<MovieResponse> {
  if (!sessionId) {
    throw new Error('Session ID is required');
  }

  try {
    const storedRatings = localStorage.getItem('movie_ratings');
    const ratings = storedRatings ? JSON.parse(storedRatings) : {};

    const popularMovies = await getPopularMovies(page);

    const moviesWithRatings = popularMovies.results.map(movie => ({
      ...movie,
      rating: ratings[movie.id] || undefined
    }));

    const ratedMovies = moviesWithRatings.filter(movie => movie.rating);

    return {
      ...popularMovies,
      results: ratedMovies,
      total_results: ratedMovies.length
    };
  } catch (error) {
    console.error('Error getting rated movies from localStorage:', error);
    throw new Error('Failed to get rated movies from local storage');
  }
}

export async function rateMovie(
  sessionId: string,
  movieId: number,
  rating: number
): Promise<{ status_code: number; status_message: string }> {
  if (!sessionId) {
    throw new Error('Session ID is required');
  }

  try {
    const storedRatings = localStorage.getItem('movie_ratings');
    const ratings = storedRatings ? JSON.parse(storedRatings) : {};

    if (rating > 0) {
      ratings[movieId] = rating;
    } else {
      delete ratings[movieId];
    }

    localStorage.setItem('movie_ratings', JSON.stringify(ratings));

    console.log('Rating saved to localStorage:', { movieId, rating });

    return {
      status_code: 201,
      status_message: 'Success'
    };
  } catch (error) {
    console.error('Error saving rating to localStorage:', error);
    throw new Error('Failed to save rating to local storage');
  }
}

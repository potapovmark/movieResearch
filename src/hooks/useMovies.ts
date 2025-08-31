import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchMovies, getPopularMovies, getRatedMovies, rateMovie } from '@/services/movieService';
import { Movie, MovieResponse } from '@/types/movie';

export function useSearchMovies(query: string, page: number = 1) {
  return useQuery({
    queryKey: ['movies', 'search', query, page],
    queryFn: () => searchMovies(query, page),
    enabled: !!query.trim(),
    staleTime: 2 * 60 * 1000,
  });
}

export function usePopularMovies(page: number = 1) {
  return useQuery({
    queryKey: ['movies', 'popular', page],
    queryFn: () => getPopularMovies(page),
    staleTime: 2 * 60 * 1000,
  });
}

export function useRatedMovies(sessionId: string, page: number = 1) {
  return useQuery({
    queryKey: ['movies', 'rated', sessionId, page],
    queryFn: () => getRatedMovies(sessionId, page),
    enabled: !!sessionId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useRateMovie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, movieId, rating }: {
      sessionId: string;
      movieId: number;
      rating: number;
    }) => rateMovie(sessionId, movieId, rating),
    onMutate: async ({ movieId, rating }) => {
      await queryClient.cancelQueries({ queryKey: ['movies', 'popular'] });
      await queryClient.cancelQueries({ queryKey: ['movies', 'search'] });
      await queryClient.cancelQueries({ queryKey: ['movies', 'rated'] });

      const previousPopular = queryClient.getQueryData(['movies', 'popular']);
      const previousSearch = queryClient.getQueriesData({ queryKey: ['movies', 'search'] });
      const previousRated = queryClient.getQueriesData({ queryKey: ['movies', 'rated'] });

      queryClient.setQueryData(['movies', 'popular'], (oldData: MovieResponse | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          results: oldData.results.map((movie: Movie) =>
            movie.id === movieId
              ? { ...movie, rating: rating }
              : movie
          )
        };
      });

      queryClient.setQueriesData(
        { queryKey: ['movies', 'search'] },
        (oldData: MovieResponse | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            results: oldData.results.map((movie: Movie) =>
              movie.id === movieId
                ? { ...movie, rating: rating }
                : movie
            )
          };
        }
      );

      queryClient.setQueriesData(
        { queryKey: ['movies', 'rated'] },
        (oldData: MovieResponse | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            results: oldData.results.map((movie: Movie) =>
              movie.id === movieId
                ? { ...movie, rating: rating }
                : movie
            )
          };
        }
      );

      return { previousPopular, previousSearch, previousRated };
    },
    onError: (err, variables, context) => {
      if (context?.previousPopular) {
        queryClient.setQueryData(['movies', 'popular'], context.previousPopular);
      }
      if (context?.previousSearch) {
        context.previousSearch.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousRated) {
        context.previousRated.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (data, variables) => {
      const { movieId, rating } = variables;

      try {
        const storedRatings = localStorage.getItem('movie_ratings');
        const ratings = storedRatings ? JSON.parse(storedRatings) : {};

        if (rating > 0) {
          ratings[movieId] = rating;
        } else {
          delete ratings[movieId];
        }

        localStorage.setItem('movie_ratings', JSON.stringify(ratings));

        window.dispatchEvent(new CustomEvent('ratingUpdated', {
          detail: { movieId, rating }
        }));
      } catch (error) {
        console.error('Error updating localStorage:', error);
      }
    },
    onSettled: () => {
    },
  });
}

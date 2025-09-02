'use client';

import { Input, Pagination, Spin } from 'antd';


import { useSearchMovies, usePopularMovies } from '@/hooks/useMovies';
import { useAppContext } from '@/contexts/AppContext';
import MovieList from './MovieList';
import styles from './MovieSearch.module.css';

interface MovieSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  totalPages: number;
  totalResults: number;
  loading: boolean;
  initialMovies?: import('@/types/movie').MovieResponse;
  initialGenres?: import('@/types/movie').Genre[];
}

export default function MovieSearch({
  query,
  onQueryChange,
  currentPage,
  onPageChange,
  totalPages,
  totalResults,
  loading,
  initialMovies,
  initialGenres
}: MovieSearchProps) {
  const { genres } = useAppContext();

  const { data: searchData, isLoading: searchLoading } = useSearchMovies(query, currentPage);
  const { data: popularData, isLoading: popularLoading } = usePopularMovies(currentPage);

  const isLoading = loading || searchLoading || popularLoading;

  const getStoredRatings = () => {
    if (typeof window === 'undefined') return {};
    const storedRatings = localStorage.getItem('movie_ratings');
    return storedRatings ? JSON.parse(storedRatings) : {};
  };

  // Используем начальные данные если нет поискового запроса и это первая страница
  const shouldUseInitialData = !query.trim() && currentPage === 1 && initialMovies;

  const movies = (shouldUseInitialData
    ? initialMovies.results
    : query.trim()
      ? searchData?.results || []
      : popularData?.results || []
  ).map(movie => {
    const ratings = getStoredRatings();
    return {
      ...movie,
      rating: ratings[movie.id] || undefined
    };
  });

  const totalPagesToShow = shouldUseInitialData
    ? initialMovies.total_pages
    : query.trim()
      ? searchData?.total_pages || 0
      : totalPages;
  const totalResultsToShow = shouldUseInitialData
    ? initialMovies.total_results
    : query.trim()
      ? searchData?.total_results || 0
      : totalResults;

  const handleSearch = (value: string) => {
    onQueryChange(value);
    onPageChange(1);
  };

  const handlePageChange = (page: number) => {
    onPageChange(page);
  };

  return (
    <div className={styles.container}>
      <div className={styles.searchContainer}>
        <Input
          placeholder="Type to search..."
          allowClear
          size="large"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onPressEnter={(e) => handleSearch((e.target as HTMLInputElement).value)}
          className={styles.searchInput}
        />
      </div>

      {isLoading ? (
        <div className={styles.loadingContainer}>
          <Spin size="large" />
          <p>Loading movies...</p>
        </div>
      ) : (
        <>
          {query.trim() && movies.length === 0 ? (
            <div className={styles.noResultsContainer}>
              <p>No movies found for &quot;{query}&quot;</p>
              <p>Try a different search term</p>
            </div>
          ) : (
            <>
              <MovieList
                movies={movies}
                genres={initialGenres || genres}
                showUserRating={true}
              />

              {totalPagesToShow > 1 && (
                <div className={styles.paginationContainer}>
                                      <Pagination
                      current={currentPage}
                      total={100}
                      pageSize={20}
                      onChange={handlePageChange}
                      showSizeChanger={false}
                      showQuickJumper={false}
                      showLessItems={true}
                      size="default"
                    />
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

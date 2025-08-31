'use client';

import { Input, Pagination, Spin } from 'antd';


import { SearchOutlined } from '@ant-design/icons';
import { useSearchMovies, usePopularMovies } from '@/hooks/useMovies';
import { useAppContext } from '@/contexts/AppContext';
import MovieList from './MovieList';
import styles from './MovieSearch.module.css';

const { Search } = Input;

interface MovieSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  totalPages: number;
  totalResults: number;
  loading: boolean;
}

export default function MovieSearch({
  query,
  onQueryChange,
  currentPage,
  onPageChange,
  totalPages,
  totalResults,
  loading
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

  const movies = (query.trim() ? searchData?.results || [] : popularData?.results || []).map(movie => {
    const ratings = getStoredRatings();
    return {
      ...movie,
      rating: ratings[movie.id] || undefined
    };
  });

  const totalPagesToShow = query.trim() ? searchData?.total_pages || 0 : totalPages;
  const totalResultsToShow = query.trim() ? searchData?.total_results || 0 : totalResults;

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
        <Search
          placeholder="Search for movies..."
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onSearch={handleSearch}
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
              <MovieList movies={movies} genres={genres} showUserRating={true} />

              {totalPagesToShow > 1 && (
                <div className={styles.paginationContainer}>
                  <Pagination
                    current={currentPage}
                    total={totalResultsToShow}
                    pageSize={20}
                    onChange={handlePageChange}
                    showSizeChanger={false}
                    showQuickJumper
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

'use client';

import { useState, useEffect } from 'react';
import { Input, Pagination, Spin, Alert } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { searchMovies, getPopularMovies, getGenres } from '@/services/movieService';
import { Movie, Genre } from '@/types/movie';
import MovieList from './MovieList';
import styles from './MovieSearchApp.module.css';

const { Search } = Input;

export default function MovieSearchApp() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    loadGenres();
    loadPopularMovies();
  }, []);

  const loadGenres = async () => {
    try {
      const genresData = await getGenres();
      setGenres(genresData.genres);
    } catch (err) {
      console.error('Error loading genres:', err);
    }
  };

  const loadPopularMovies = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPopularMovies(currentPage);
      setMovies(data.results);
      setTotalPages(data.total_pages);
      setTotalResults(data.total_results);
    } catch (err) {
      setError('Failed to load popular movies');
      console.error('Error loading popular movies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);

    if (!value.trim()) {
      loadPopularMovies();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await searchMovies(value, 1);
      setMovies(data.results);
      setTotalPages(data.total_pages);
      setTotalResults(data.total_results);
    } catch (err) {
      setError('Failed to search movies');
      console.error('Error searching movies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
    setLoading(true);
    setError(null);

    try {
      let data;
      if (searchQuery.trim()) {
        data = await searchMovies(searchQuery, page);
      } else {
        data = await getPopularMovies(page);
      }
      setMovies(data.results);
      setTotalPages(data.total_pages);
      setTotalResults(data.total_results);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError('Failed to load movies');
      console.error('Error loading movies:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Movie Search App</h1>

      <div className={styles.searchContainer}>
        <Search
          placeholder="Search for movies..."
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onSearch={handleSearch}
          className={styles.searchInput}
        />
      </div>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          className={styles.errorAlert}
        />
      )}

      {loading ? (
        <div className={styles.loadingContainer}>
          <Spin size="large" />
          <p>Loading movies...</p>
        </div>
      ) : (
        <>
          <MovieList movies={movies} genres={genres} />

          {totalPages > 1 && (
            <div className={styles.paginationContainer}>
              <Pagination
                current={currentPage}
                total={totalResults}
                pageSize={20}
                onChange={handlePageChange}
                showSizeChanger={false}
                showQuickJumper
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

'use client';

import { Tabs, TabsProps, Pagination } from 'antd';
import { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { usePopularMovies, useRatedMovies } from '@/hooks/useMovies';
import { Genre, MovieResponse } from '@/types/movie';
import MovieList from './MovieList';
import MovieSearch from './MovieSearch';
import styles from './MovieTabs.module.css';

interface MovieTabsProps {
  initialMovies?: MovieResponse;
  initialGenres?: Genre[];
  initialQuery?: string;
  initialPage?: number;
}

export default function MovieTabs({
  initialMovies,
  initialGenres,
  initialQuery = '',
  initialPage = 1
}: MovieTabsProps) {
  const { session, genres, loading: contextLoading } = useAppContext();
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const { data: popularData, isLoading: popularLoading } = usePopularMovies(currentPage);
  const { data: ratedData, isLoading: ratedLoading, refetch: refetchRated } = useRatedMovies(
    session?.guest_session_id || '',
    currentPage
  );

  useEffect(() => {
    const handleRatingUpdate = () => {
      if (activeTab === 'rated' && session?.guest_session_id) {
        refetchRated();
      }
    };

    window.addEventListener('ratingUpdated', handleRatingUpdate as EventListener);
    return () => window.removeEventListener('ratingUpdated', handleRatingUpdate as EventListener);
  }, [activeTab, session?.guest_session_id, refetchRated]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setCurrentPage(1);
    if (key === 'search') {
      setSearchQuery('');
    } else if (key === 'rated' && session?.guest_session_id) {
      refetchRated();
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tabs: TabsProps['items'] = [
    {
      key: 'search',
      label: 'Search',
      children: (
        <MovieSearch
          query={searchQuery}
          onQueryChange={setSearchQuery}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          totalPages={popularData?.total_pages || initialMovies?.total_pages || 0}
          totalResults={popularData?.total_results || initialMovies?.total_results || 0}
          loading={popularLoading}
          initialMovies={initialMovies}
          initialGenres={initialGenres}
        />
      ),
    },
    {
      key: 'rated',
      label: 'Rated',
      children: (
        <div className={styles.ratedContainer}>
          {contextLoading ? (
            <div className={styles.loadingContainer}>
              <p>Initializing...</p>
            </div>
          ) : !session ? (
            <div className={styles.errorContainer}>
              <p>Failed to create guest session. Please refresh the page.</p>
            </div>
          ) : (
            <>
              <h2 className={styles.ratedTitle}>Your Rated Movies</h2>
              {ratedLoading ? (
                <div className={styles.loadingContainer}>
                  <p>Loading your rated movies...</p>
                </div>
              ) : ratedData && ratedData.results.length > 0 ? (
                <>
                  <MovieList
                    movies={ratedData.results}
                    genres={genres}
                    showUserRating={true}
                  />
                  {ratedData.total_pages > 1 && (
                    <div className={styles.paginationContainer}>
                      <Pagination
                        current={currentPage}
                        total={ratedData.total_results}
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
              ) : (
                <div className={styles.emptyContainer}>
                  <p>You haven&apos;t rated any movies yet.</p>
                  <p>Go to the Search tab to find and rate movies!</p>
                </div>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <Tabs
        activeKey={activeTab}
        items={tabs}
        onChange={handleTabChange}
        className={styles.tabs}
        size="large"
      />
    </div>
  );
}

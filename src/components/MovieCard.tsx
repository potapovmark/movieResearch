'use client';

import { Card, Tag, Rate, Tooltip } from 'antd';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Movie, Genre } from '@/types/movie';
import { formatDate } from '@/utils/dateUtils';
import { truncateText } from '@/utils/textUtils';
import { useRateMovie } from '@/hooks/useMovies';
import { useAppContext } from '@/contexts/AppContext';
import styles from './MovieCard.module.css';

interface MovieCardProps {
  movie: Movie;
  genres: Genre[];
  showUserRating?: boolean;
}

export default function MovieCard({ movie, genres, showUserRating = false }: MovieCardProps) {
  const { session, updateRating } = useAppContext();
  const rateMovieMutation = useRateMovie();
  const [localRating, setLocalRating] = useState(0);
  const [hasUserRated, setHasUserRated] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRatings = localStorage.getItem('movie_ratings');
      if (storedRatings) {
        const ratings = JSON.parse(storedRatings);
        const userRating = ratings[movie.id] || 0;
        setLocalRating(userRating);
        setHasUserRated(userRating > 0);
      }
    }
  }, [movie.id]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'movie_ratings' && e.newValue) {
        try {
          const ratings = JSON.parse(e.newValue);
          const userRating = ratings[movie.id] || 0;
          setLocalRating(userRating);
          setHasUserRated(userRating > 0);
        } catch (error) {
          console.error('Error parsing storage change:', error);
        }
      }
    };

    const handleRatingUpdate = (e: CustomEvent) => {
      if (e.detail.movieId === movie.id) {
        setLocalRating(e.detail.rating);
        setHasUserRated(e.detail.rating > 0);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('ratingUpdated', handleRatingUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ratingUpdated', handleRatingUpdate as EventListener);
    };
  }, [movie.id]);

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;

  const movieGenres = genres
    .filter((genre) => movie.genre_ids?.includes(genre.id))
    .slice(0, 2);

  const getRatingColor = (rating: number) => {
    if (rating >= 0 && rating < 3) return '#E90000';
    if (rating >= 3 && rating < 5) return '#E97E00';
    if (rating >= 5 && rating < 7) return '#E9D100';
    if (rating >= 7) return '#66E900';
    return '#ccc';
  };

  const handleRatingChange = async (value: number) => {
    if (!session) return;

    setLocalRating(value);
    setHasUserRated(value > 0);

    updateRating(movie.id, value);

    try {
      await rateMovieMutation.mutateAsync({
        sessionId: session.guest_session_id,
        movieId: movie.id,
        rating: value
      });
    } catch (error) {
      console.error('Error rating movie:', error);
      setLocalRating(movie.rating || 0);
      setHasUserRated((movie.rating || 0) > 0);
    }
  };

    return (
    <Card className={styles.movieCard}>
      <div className={styles.cardContainer}>
        <div className={styles.posterContainer}>
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={movie.title}
              width={120}
              height={180}
              className={styles.poster}
            />
          ) : (
            <div className={styles.noPoster}>
              <span>No Image</span>
            </div>
          )}
        </div>

        <div className={styles.contentContainer}>
          <div className={styles.headerContainer}>
            <h3 className={styles.title}>{movie.title}</h3>
            <div className={styles.ratingsContainer}>
              <Tooltip title={hasUserRated ? "Your rating" : "No rating yet"}>
                <div
                  className={styles.apiRatingCircle}
                  style={{ borderColor: hasUserRated ? getRatingColor(localRating) : '#ccc' }}
                >
                  {hasUserRated ? localRating.toFixed(1) : '0'}
                </div>
              </Tooltip>
            </div>
          </div>

          <p className={styles.releaseDate}>
            {formatDate(movie.release_date)}
          </p>

          <div className={styles.genresContainer}>
            {movieGenres.map((genre) => (
              <Tag key={genre.id} className={styles.genreTag}>
                {genre.name}
              </Tag>
            ))}
          </div>

          <p className={styles.overview}>
            {truncateText(movie.overview, 150)}
          </p>

          {showUserRating && (
            <div className={styles.ratingContainer}>
              <Rate
                value={localRating}
                onChange={handleRatingChange}
                disabled={rateMovieMutation.isPending}
                allowClear={false}
                count={10}
              />
            </div>
          )}
        </div>
      </div>


      <div className={styles.bottomContent}>
        <p className={styles.overview}>
          {truncateText(movie.overview, 150)}
        </p>

        {showUserRating && (
          <div className={styles.ratingContainer}>
            <Rate
              value={localRating}
              onChange={handleRatingChange}
              disabled={rateMovieMutation.isPending}
              allowClear={false}
              count={10}
            />
          </div>
        )}
      </div>
    </Card>
  );
}

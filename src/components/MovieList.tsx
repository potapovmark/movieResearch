import { Movie, Genre } from '@/types/movie';
import MovieCard from './MovieCard';
import styles from './MovieList.module.css';

interface MovieListProps {
  movies: Movie[];
  genres: Genre[];
  showUserRating?: boolean;
}

export default function MovieList({ movies, genres, showUserRating = false }: MovieListProps) {
  if (movies.length === 0) {
    return <div className={styles.emptyState}>No movies found</div>;
  }

  return (
    <div className={styles.movieList}>
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          genres={genres}
          showUserRating={showUserRating}
        />
      ))}
    </div>
  );
}

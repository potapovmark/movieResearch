'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Genre, GuestSession } from '@/types/movie';
import { getGenres, createGuestSession } from '@/services/movieService';

interface AppContextType {
  genres: Genre[];
  session: GuestSession | null;
  loading: boolean;
  error: string | null;
  refreshGenres: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateRating: (movieId: number, rating: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [session, setSession] = useState<GuestSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGenres = async () => {
    try {
      const genresData = await getGenres();
      setGenres(genresData.genres);
    } catch (err) {
      console.error('Error loading genres:', err);
      setError('Failed to load genres');
    }
  };

  const loadSession = async () => {
    try {
      const sessionData = await createGuestSession();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      setSession({
        guest_session_id: sessionData.guest_session_id,
        expires_at: expiresAt
      });
    } catch (err) {
      console.error('Error creating guest session:', err);
      setError('Failed to create guest session');
    }
  };

  const refreshGenres = async () => {
    await loadGenres();
  };

  const refreshSession = async () => {
    await loadSession();
  };

  const updateRating = (movieId: number, rating: number) => {
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
      console.error('Error updating rating in context:', error);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      setLoading(true);
      setError(null);

      try {
        await Promise.all([loadGenres(), loadSession()]);
      } catch (err) {
        console.error('Error initializing app:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  const value: AppContextType = {
    genres,
    session,
    loading,
    error,
    refreshGenres,
    refreshSession,
    updateRating
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

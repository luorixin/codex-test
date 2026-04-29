import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

export function useScreenData<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const hasDataRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const shouldShowInitialLoading = !hasDataRef.current;

      if (shouldShowInitialLoading) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      fetcher()
        .then((result) => {
          if (!cancelled) {
            setData(result);
            hasDataRef.current = true;
          }
        })
        .catch((caught) => {
          if (!cancelled) {
            setError(caught instanceof Error ? caught : new Error(String(caught)));
          }
        })
        .finally(() => {
          if (!cancelled) {
            if (shouldShowInitialLoading) {
              setIsLoading(false);
            } else {
              setIsRefreshing(false);
            }
          }
        });

      return () => {
        cancelled = true;
      };
    }, [fetcher]),
  );

  return { data, isLoading, isRefreshing, error, errorMessage: error?.message ?? null };
}

import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

export function useScreenData<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      setIsLoading(true);
      setError(null);

      fetcher()
        .then((result) => {
          if (!cancelled) {
            setData(result);
          }
        })
        .catch((caught) => {
          if (!cancelled) {
            setError(caught instanceof Error ? caught : new Error(String(caught)));
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsLoading(false);
          }
        });

      return () => {
        cancelled = true;
      };
    }, [fetcher]),
  );

  return { data, isLoading, error, errorMessage: error?.message ?? null };
}

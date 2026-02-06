import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/components/ui/toast';

interface UseAsyncOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  showErrorToast?: boolean;
  errorMessage?: string;
  retryCount?: number;
  retryDelay?: number;
}

interface UseAsyncReturn<T, Args extends unknown[]> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...args: Args) => Promise<T | null>;
  reset: () => void;
  retry: () => void;
}

export function useAsync<T, Args extends unknown[] = unknown[]>(
  asyncFunction: (...args: Args) => Promise<T>,
  options: UseAsyncOptions<T> = {}
): UseAsyncReturn<T, Args> {
  const {
    onSuccess,
    onError,
    showErrorToast = true,
    errorMessage = 'Terjadi kesalahan. Silakan coba lagi.',
    retryCount = 0,
    retryDelay = 1000,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const lastArgs = useRef<Args | null>(null);
  const retryAttempts = useRef(0);
  const { toast } = useToast();

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    lastArgs.current = null;
    retryAttempts.current = 0;
  }, []);

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      lastArgs.current = args;
      setLoading(true);
      setError(null);

      try {
        const result = await asyncFunction(...args);
        setData(result);
        retryAttempts.current = 0;
        onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);

        // Retry logic
        if (retryAttempts.current < retryCount) {
          retryAttempts.current++;
          console.log(`Retrying... Attempt ${retryAttempts.current}/${retryCount}`);
          
          await new Promise(resolve => setTimeout(resolve, retryDelay * retryAttempts.current));
          return execute(...args);
        }

        if (showErrorToast) {
          toast({
            title: 'Error',
            description: errorMessage,
            variant: 'destructive',
          });
        }

        onError?.(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [asyncFunction, onSuccess, onError, showErrorToast, errorMessage, retryCount, retryDelay, toast]
  );

  const retry = useCallback(() => {
    if (lastArgs.current) {
      retryAttempts.current = 0;
      execute(...lastArgs.current);
    }
  }, [execute]);

  return { data, loading, error, execute, reset, retry };
}

// Hook for API calls with automatic error handling
export function useApi<T, Args extends unknown[] = unknown[]>(
  apiFunction: (...args: Args) => Promise<T>,
  options: UseAsyncOptions<T> & { immediate?: boolean } = {}
) {
  const { immediate = false, ...asyncOptions } = options;
  const asyncState = useAsync(apiFunction, asyncOptions);

  useEffect(() => {
    if (immediate) {
      asyncState.execute(...([] as unknown as Args));
    }
  }, []);

  return asyncState;
}

// Hook for optimistic updates
export function useOptimistic<T>(
  initialValue: T,
  updateFunction: (newValue: T) => Promise<T>
) {
  const [value, setValue] = useState<T>(initialValue);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const update = useCallback(
    async (newValue: T) => {
      const previousValue = value;
      
      // Optimistic update
      setValue(newValue);
      setIsUpdating(true);
      setError(null);

      try {
        const result = await updateFunction(newValue);
        setValue(result);
        return result;
      } catch (err) {
        // Rollback on error
        setValue(previousValue);
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        
        toast({
          title: 'Gagal menyimpan',
          description: 'Perubahan dibatalkan',
          variant: 'destructive',
        });
        
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [value, updateFunction, toast]
  );

  return { value, update, isUpdating, error };
}

// Debounce hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttle hook
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const timer = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(timer);
    };
  }, [value, limit]);

  return throttledValue;
}

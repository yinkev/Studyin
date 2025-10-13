import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * Performance-optimized data fetching hook with:
 * - Request deduplication
 * - Intelligent caching
 * - Automatic retries with exponential backoff
 * - Request cancellation
 * - Memory leak prevention
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface FetchOptions {
  ttl?: number; // Time to live in milliseconds
  retries?: number;
  retryDelay?: number;
  dedupe?: boolean;
  cacheKey?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

// Global cache for request deduplication
const requestCache = new Map<string, CacheEntry<any>>();
const pendingRequests = new Map<string, Promise<any>>();

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  requestCache.forEach((entry, key) => {
    if (now > entry.timestamp + entry.ttl) {
      requestCache.delete(key);
    }
  });
}, 60000); // Clean every minute

export function useOptimizedData<T = any>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList = [],
  options: FetchOptions = {}
) {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default
    retries = 3,
    retryDelay = 1000,
    dedupe = true,
    cacheKey,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const retriesRef = useRef(0);

  // Generate cache key from dependencies if not provided
  const generatedCacheKey = useMemo(() => {
    if (cacheKey) return cacheKey;
    return JSON.stringify(deps);
  }, [cacheKey, ...deps]);

  // Check cache first
  const getCachedData = useCallback(() => {
    if (!dedupe) return null;

    const cached = requestCache.get(generatedCacheKey);
    if (cached && Date.now() < cached.timestamp + cached.ttl) {
      return cached.data;
    }
    return null;
  }, [generatedCacheKey, dedupe]);

  // Fetch with retry logic
  const fetchWithRetry = useCallback(
    async (attemptNumber = 1): Promise<T> => {
      try {
        const result = await fetcher();
        retriesRef.current = 0;
        return result;
      } catch (err) {
        if (attemptNumber < retries) {
          // Exponential backoff
          const delay = retryDelay * Math.pow(2, attemptNumber - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return fetchWithRetry(attemptNumber + 1);
        }
        throw err;
      }
    },
    [fetcher, retries, retryDelay]
  );

  // Main fetch function
  const fetchData = useCallback(async () => {
    // Check if component is still mounted
    if (!mountedRef.current) return;

    // Check cache first
    const cached = getCachedData();
    if (cached !== null) {
      setData(cached);
      setLoading(false);
      onSuccess?.(cached);
      return;
    }

    // Check for pending request (deduplication)
    if (dedupe && pendingRequests.has(generatedCacheKey)) {
      try {
        const result = await pendingRequests.get(generatedCacheKey);
        if (mountedRef.current) {
          setData(result);
          setError(null);
          onSuccess?.(result);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err as Error);
          onError?.(err as Error);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
      return;
    }

    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    // Create promise for deduplication
    const fetchPromise = fetchWithRetry();

    if (dedupe) {
      pendingRequests.set(generatedCacheKey, fetchPromise);
    }

    try {
      const result = await fetchPromise;

      // Check if request was cancelled
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      if (mountedRef.current) {
        setData(result);
        setError(null);

        // Cache the result
        if (dedupe) {
          requestCache.set(generatedCacheKey, {
            data: result,
            timestamp: Date.now(),
            ttl,
          });
        }

        onSuccess?.(result);
      }
    } catch (err) {
      // Check if request was cancelled
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      if (mountedRef.current) {
        setError(err as Error);
        setData(null);
        onError?.(err as Error);

        // Show error toast in development
        if (process.env.NODE_ENV === 'development') {
          toast.error(`Failed to fetch data: ${(err as Error).message}`);
        }
      }
    } finally {
      if (dedupe) {
        pendingRequests.delete(generatedCacheKey);
      }

      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [generatedCacheKey, getCachedData, fetchWithRetry, dedupe, ttl, onSuccess, onError]);

  // Refetch function
  const refetch = useCallback(() => {
    // Clear cache for this key
    requestCache.delete(generatedCacheKey);
    return fetchData();
  }, [generatedCacheKey, fetchData]);

  // Invalidate cache
  const invalidate = useCallback(() => {
    requestCache.delete(generatedCacheKey);
  }, [generatedCacheKey]);

  // Effect to fetch data
  useEffect(() => {
    fetchData();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, deps);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    error,
    loading,
    refetch,
    invalidate,
    isValidating: loading && data !== null, // Revalidating with existing data
  };
}

/**
 * Hook for infinite scrolling with performance optimization
 */
export function useInfiniteScroll<T = any>(
  fetcher: (page: number) => Promise<T[]>,
  options: {
    initialPage?: number;
    pageSize?: number;
    threshold?: number;
    ttl?: number;
  } = {}
) {
  const {
    initialPage = 0,
    pageSize = 20,
    threshold = 100,
    ttl = 5 * 60 * 1000,
  } = options;

  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Load more items
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const newItems = await fetcher(page);

      setItems((prev) => [...prev, ...newItems]);
      setHasMore(newItems.length >= pageSize);
      setPage((prev) => prev + 1);
    } catch (err) {
      setError(err as Error);
      toast.error('Failed to load more items');
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore, fetcher, pageSize]);

  // Set up intersection observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          loadMore();
        }
      },
      {
        rootMargin: `${threshold}px`,
      }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, threshold]);

  // Reset function
  const reset = useCallback(() => {
    setItems([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
  }, [initialPage]);

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
    loadMoreRef,
  };
}

/**
 * Hook for debounced values with performance optimization
 */
export function useDebouncedValue<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set new timer
    timerRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for throttled callbacks with performance optimization
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 100
): T {
  const lastRunRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      if (timeSinceLastRun >= delay) {
        lastRunRef.current = now;
        callback(...args);
      } else {
        // Schedule for later
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          lastRunRef.current = Date.now();
          callback(...args);
        }, delay - timeSinceLastRun);
      }
    },
    [callback, delay]
  ) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}
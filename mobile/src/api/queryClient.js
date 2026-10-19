import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { APP_CONFIG } from '../constants/app';
import { HTTP_STATUS } from '../constants/api';

/**
 * TanStack Query Client configuration
 * Tuned for mobile resilience: bounded retries with jittered exponential backoff,
 * cold-start tolerance, and zero duplicate mutation retries.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: APP_CONFIG.QUERY_STALE_TIME_MS,
      gcTime: APP_CONFIG.QUERY_GC_TIME_MS,
      retry: (failureCount, error) => {
        // Strictly never retry client auth, permission, conflict, or validation errors
        if (
          error?.status === HTTP_STATUS.UNAUTHORIZED ||
          error?.status === HTTP_STATUS.FORBIDDEN ||
          error?.status === HTTP_STATUS.NOT_FOUND ||
          error?.status === HTTP_STATUS.BAD_REQUEST ||
          error?.status === HTTP_STATUS.CONFLICT ||
          error?.status === 422 ||
          error?.isUnauthorized
        ) {
          return false;
        }
        // Allow at most 2 bounded retries for transient network/timeout/cold-start issues
        return failureCount < 2;
      },
      // Exponential backoff with jitter: 1.2s -> 2.4s -> 4.8s (max 8s)
      retryDelay: (attemptIndex) =>
        Math.min(1000 * 2 ** attemptIndex + Math.floor(Math.random() * 500), 8000),
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false, // Strictly NO automatic retries on mutations to avoid duplicate orders/payments
    },
  },
});

/**
 * Provider component wrapping children with QueryClientProvider
 */
export const QueryProvider = ({ children }) => {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

export default queryClient;

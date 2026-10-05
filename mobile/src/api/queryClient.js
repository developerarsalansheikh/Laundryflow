import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { APP_CONFIG } from '../constants/app';
import { HTTP_STATUS } from '../constants/api';

/**
 * TanStack Query Client configuration
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: APP_CONFIG.QUERY_STALE_TIME_MS,
      gcTime: APP_CONFIG.QUERY_GC_TIME_MS,
      retry: (failureCount, error) => {
        // Do not retry on client auth/permission/missing or client validation errors
        if (
          error?.status === HTTP_STATUS.UNAUTHORIZED ||
          error?.status === HTTP_STATUS.FORBIDDEN ||
          error?.status === HTTP_STATUS.NOT_FOUND ||
          error?.status === HTTP_STATUS.BAD_REQUEST ||
          error?.status === 422 ||
          error?.isUnauthorized
        ) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      refetchOnReconnect: true,
      refetchOnWindowFocus: false, // In mobile, window focus is rarely desired
    },
    mutations: {
      retry: false, // Strictly NO automatic retries on mutations to avoid duplicate transactions
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

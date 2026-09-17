'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ServiceWorkerRegistrar } from '@/components/pwa/ServiceWorkerRegistrar';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Mobile-first defaults: assume a flaky link, avoid refetch storms.
            staleTime: 60_000,
            gcTime: 24 * 3_600_000,
            retry: (failureCount, error) => {
              const status = (error as { status?: number })?.status;
              if (status && status >= 400 && status < 500 && status !== 429) {
                return false;
              }
              return failureCount < 3;
            },
            retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 20_000),
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            networkMode: 'offlineFirst',
          },
          mutations: {
            networkMode: 'offlineFirst',
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ServiceWorkerRegistrar />
    </QueryClientProvider>
  );
}

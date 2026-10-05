import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlatformSettingsApi, updatePlatformSettingsApi } from '../api/settings';

const QUERY_KEY = ['superadmin', 'platform-settings'];

/**
 * usePlatformSettings — fetch platform settings singleton.
 */
export const usePlatformSettings = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getPlatformSettingsApi,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

/**
 * useUpdatePlatformSettings — mutation to save platform settings.
 */
export const useUpdatePlatformSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePlatformSettingsApi,
    onSuccess: (data) => {
      // Optimistically update the cache immediately
      queryClient.setQueryData(QUERY_KEY, data);
    },
  });
};

export default usePlatformSettings;

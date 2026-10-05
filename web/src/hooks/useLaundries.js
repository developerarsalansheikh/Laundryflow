import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSuperAdminLaundriesApi,
  getDashboardStatsApi,
  getLaundryByIdApi,
  approveLaundryApi,
  rejectLaundryApi,
  suspendLaundryApi,
  updateLaundryCommissionApi,
  createLaundryApi,
} from '../api/laundries';

/**
 * Fetch paginated laundries list with optional status & city parameters.
 */
export const useLaundries = (params = {}) => {
  return useQuery({
    queryKey: ['superadmin', 'laundries', params],
    queryFn: () => getSuperAdminLaundriesApi(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
    keepPreviousData: true,
  });
};

/**
 * Fetch aggregate platform stats (Total, Active, Pending laundries, etc.).
 */
export const useLaundryStats = () => {
  return useQuery({
    queryKey: ['superadmin', 'dashboard'],
    queryFn: getDashboardStatsApi,
    staleTime: 1000 * 60 * 2,
  });
};

/**
 * Fetch detailed view for a single laundry.
 */
export const useLaundryDetails = (id) => {
  return useQuery({
    queryKey: ['superadmin', 'laundry', id],
    queryFn: () => getLaundryByIdApi(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Mutation: Create a new laundry and owner user account.
 */
export const useCreateLaundry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLaundryApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'laundries'] });
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'dashboard'] });
    },
  });
};

/**
 * Mutation: Approve pending laundry.
 */
export const useApproveLaundry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => approveLaundryApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'laundries'] });
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'dashboard'] });
    },
  });
};

/**
 * Mutation: Reject pending laundry with optional reason.
 */
export const useRejectLaundry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => rejectLaundryApi(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'laundries'] });
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'dashboard'] });
    },
  });
};

/**
 * Mutation: Suspend active laundry.
 */
export const useSuspendLaundry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => suspendLaundryApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'laundries'] });
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'dashboard'] });
    },
  });
};

/**
 * Mutation: Update commission percentage for a laundry.
 */
export const useUpdateLaundryCommission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, commissionPercent }) =>
      updateLaundryCommissionApi(id, commissionPercent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'laundries'] });
    },
  });
};

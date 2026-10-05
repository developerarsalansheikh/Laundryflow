import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSuperAdminUsersApi,
  getSuperAdminUserByIdApi,
  toggleSuperAdminUserStatusApi,
} from '../api/users';

/**
 * Fetch platform users with pagination, search, role, and status filters.
 * Backed by: GET /api/super-admin/users
 */
export const useUsers = (params = {}) => {
  return useQuery({
    queryKey: ['superadmin', 'users', params],
    queryFn: () => getSuperAdminUsersApi(params),
    staleTime: 1000 * 60 * 2,
    keepPreviousData: true,
  });
};

/**
 * Fetch single user details by ID for SuperAdmin.
 * Backed by: GET /api/super-admin/users/:id
 */
export const useUserDetails = (id) => {
  return useQuery({
    queryKey: ['superadmin', 'user', id],
    queryFn: () => getSuperAdminUserByIdApi(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Mutation to activate or deactivate a user account.
 * Backed by: PUT /api/super-admin/users/:id/toggle-status
 */
export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleSuperAdminUserStatusApi,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'user', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'dashboard'] });
    },
  });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSuperAdminEmployeesApi,
  getEmployeeByIdApi,
  toggleEmployeeStatusApi,
} from '../api/employees';

/**
 * Fetch platform employees with pagination, search, role, and status filters.
 * Backed by: GET /api/super-admin/users
 */
export const useEmployees = (params = {}) => {
  return useQuery({
    queryKey: ['superadmin', 'employees', params],
    queryFn: () => getSuperAdminEmployeesApi(params),
    staleTime: 1000 * 60 * 2,
    keepPreviousData: true,
  });
};

/**
 * Fetch single employee details by ID for SuperAdmin.
 * Backed by: GET /api/super-admin/users/:id
 */
export const useEmployeeDetails = (id) => {
  return useQuery({
    queryKey: ['superadmin', 'employee', id],
    queryFn: () => getEmployeeByIdApi(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Mutation to activate or deactivate an employee account.
 * Backed by: PUT /api/super-admin/users/:id/toggle-status
 */
export const useToggleEmployeeStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleEmployeeStatusApi,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'employees'] });
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'employee', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'users'] });
    },
  });
};

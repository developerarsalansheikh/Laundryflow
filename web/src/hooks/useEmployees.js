import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSuperAdminEmployeesApi,
  getEmployeeByIdApi,
  toggleEmployeeStatusApi,
  createDeliveryPartnerApi,
  updateDeliveryPartnerApi,
  getDeliveryPartnersApi,
  toggleDeliveryPartnerApi,
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
 * Fetch platform delivery partners.
 * Backed by: GET /api/laundry/admin/delivery-partners
 */
export const useDeliveryPartners = (params = {}) => {
  return useQuery({
    queryKey: ['superadmin', 'delivery-partners', params],
    queryFn: () => getDeliveryPartnersApi(params),
    staleTime: 1000 * 60 * 2,
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
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'delivery-partners'] });
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'employee', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'users'] });
    },
  });
};

/**
 * Mutation to create a new delivery partner.
 * Backed by: POST /api/laundry/admin/delivery-partner
 */
export const useCreateDeliveryPartner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDeliveryPartnerApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'employees'] });
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'delivery-partners'] });
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'dashboard'] });
    },
  });
};

/**
 * Mutation to update an existing delivery partner.
 * Backed by: PUT /api/laundry/admin/delivery-partner/:id
 */
export const useUpdateDeliveryPartner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDeliveryPartnerApi,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'employees'] });
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'delivery-partners'] });
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'employee', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'users'] });
    },
  });
};

/**
 * Mutation to toggle delivery partner active/inactive status.
 * Backed by: PUT /api/laundry/admin/delivery-partner/:id/toggle
 */
export const useToggleDeliveryPartner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleDeliveryPartnerApi,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'employees'] });
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'delivery-partners'] });
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'employee', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'users'] });
    },
  });
};

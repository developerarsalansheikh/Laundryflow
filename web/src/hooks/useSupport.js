import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSupportTicketsApi,
  getSupportTicketByIdApi,
  updateTicketStatusApi,
  replyTicketApi,
  createSupportTicketApi,
} from '../api/support';

const QUERY_KEY = ['superadmin', 'support-tickets'];

/**
 * useSupportTickets — paginated list with filters.
 */
export const useSupportTickets = (params = {}) => {
  return useQuery({
    queryKey: [...QUERY_KEY, params],
    queryFn: () => getSupportTicketsApi(params),
    staleTime: 60 * 1000,
    gcTime: 3 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

/**
 * useSupportTicketById — single ticket detail.
 */
export const useSupportTicketById = (id) => {
  return useQuery({
    queryKey: [...QUERY_KEY, 'detail', id],
    queryFn: () => getSupportTicketByIdApi(id),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
    retry: 1,
  });
};

/**
 * useUpdateTicketStatus — mutation to change ticket status.
 */
export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTicketStatusApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};

/**
 * useReplyTicket — mutation to send a reply to a ticket.
 */
export const useReplyTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: replyTicketApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};

/**
 * useCreateSupportTicket — mutation to create a new ticket.
 */
export const useCreateSupportTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSupportTicketApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};

export default useSupportTickets;

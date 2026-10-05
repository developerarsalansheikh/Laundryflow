import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSubscriptionPlansApi,
  getSubscriptionPlanByIdApi,
  createSubscriptionPlanApi,
  updateSubscriptionPlanApi,
  deleteSubscriptionPlanApi,
  getSubscriptionsApi,
  getSubscriptionByIdApi,
  getSubscriptionStatsApi,
  createSubscriptionApi,
  activateSubscriptionApi,
  cancelSubscriptionApi,
  renewSubscriptionApi,
} from '../api/subscriptions';

// ── Query Keys ────────────────────────────────
const PLANS_KEY = ['superadmin', 'subscription-plans'];
const SUBS_KEY = ['superadmin', 'subscriptions'];
const STATS_KEY = ['superadmin', 'subscriptions', 'stats'];
const DASHBOARD_KEY = ['superadmin', 'dashboard'];

// ── Plan Queries ──────────────────────────────

export const useSubscriptionPlans = (params = {}) => {
  return useQuery({
    queryKey: [...PLANS_KEY, params],
    queryFn: () => getSubscriptionPlansApi(params),
    staleTime: 1000 * 60 * 3,
  });
};

export const useSubscriptionPlan = (id) => {
  return useQuery({
    queryKey: [...PLANS_KEY, id],
    queryFn: () => getSubscriptionPlanByIdApi(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 3,
  });
};

// ── Subscription Queries ──────────────────────

export const useSubscriptions = (params = {}) => {
  return useQuery({
    queryKey: [...SUBS_KEY, params],
    queryFn: () => getSubscriptionsApi(params),
    staleTime: 1000 * 60 * 2,
    keepPreviousData: true,
  });
};

export const useSubscriptionDetails = (id) => {
  return useQuery({
    queryKey: [...SUBS_KEY, id],
    queryFn: () => getSubscriptionByIdApi(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 1,
  });
};

export const useSubscriptionStats = () => {
  return useQuery({
    queryKey: STATS_KEY,
    queryFn: getSubscriptionStatsApi,
    staleTime: 1000 * 60 * 2,
  });
};

// ── Plan Mutations ────────────────────────────

export const useCreateSubscriptionPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSubscriptionPlanApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PLANS_KEY });
    },
  });
};

export const useUpdateSubscriptionPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateSubscriptionPlanApi(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PLANS_KEY });
    },
  });
};

export const useDeleteSubscriptionPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteSubscriptionPlanApi(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PLANS_KEY });
    },
  });
};

// ── Subscription Mutations ────────────────────

const invalidateSubData = (qc) => {
  qc.invalidateQueries({ queryKey: SUBS_KEY });
  qc.invalidateQueries({ queryKey: STATS_KEY });
  qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
};

export const useCreateSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSubscriptionApi,
    onSuccess: () => invalidateSubData(qc),
  });
};

export const useActivateSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => activateSubscriptionApi(id),
    onSuccess: () => invalidateSubData(qc),
  });
};

export const useCancelSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => cancelSubscriptionApi(id, payload),
    onSuccess: () => invalidateSubData(qc),
  });
};

export const useRenewSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => renewSubscriptionApi(id, payload),
    onSuccess: () => invalidateSubData(qc),
  });
};

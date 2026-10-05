import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LifeBuoy,
  RefreshCw,
  AlertTriangle,
  Search,
  X,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  User,
  Building2,
  Tag,
  Send,
  ChevronDown,
  Inbox,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import {
  useSupportTickets,
  useSupportTicketById,
  useUpdateTicketStatus,
  useReplyTicket,
} from '../../hooks/useSupport';

// ── Constants ──────────────────────────────────────────────────
const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const PRIORITIES = [
  { value: '', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'billing', label: 'Billing' },
  { value: 'technical', label: 'Technical' },
  { value: 'order_issue', label: 'Order Issue' },
  { value: 'account', label: 'Account' },
  { value: 'general', label: 'General' },
];

const LIMIT = 20;

const DEFAULT_FILTERS = { search: '', status: '', priority: '', category: '' };

// ── Status Badge ───────────────────────────────────────────────
const statusConfig = {
  open: { color: 'bg-sky-500/15 text-sky-400 border-sky-500/20', icon: Inbox, label: 'Open' },
  in_progress: { color: 'bg-amber-500/15 text-amber-400 border-amber-500/20', icon: Clock, label: 'In Progress' },
  resolved: { color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', icon: CheckCircle2, label: 'Resolved' },
  closed: { color: 'bg-slate-500/15 text-slate-400 border-slate-500/20', icon: XCircle, label: 'Closed' },
};

const priorityConfig = {
  urgent: 'bg-red-500/15 text-red-400 border-red-500/20',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  low: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
};

const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] || statusConfig.open;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.color}`}>
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const cls = priorityConfig[priority] || priorityConfig.medium;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${cls}`}>
      {priority}
    </span>
  );
};

// ── Stats Bar ──────────────────────────────────────────────────
const StatsBar = ({ stats, loading }) => {
  const items = [
    { label: 'Total', value: stats?.total, color: 'text-textPrimary' },
    { label: 'Open', value: stats?.open, color: 'text-sky-400' },
    { label: 'In Progress', value: stats?.in_progress, color: 'text-amber-400' },
    { label: 'Resolved', value: stats?.resolved, color: 'text-emerald-400' },
    { label: 'Closed', value: stats?.closed, color: 'text-slate-400' },
  ];
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-1.5">
          <span className="text-xs text-textMuted">{it.label}:</span>
          {loading ? (
            <span className="w-6 h-3 bg-white/8 rounded animate-pulse inline-block" />
          ) : (
            <span className={`text-sm font-bold ${it.color}`}>{it.value ?? '—'}</span>
          )}
        </div>
      ))}
    </div>
  );
};

// ── Ticket Row ─────────────────────────────────────────────────
const TicketRow = ({ ticket, onSelect }) => (
  <tr
    className="border-b border-white/4 hover:bg-white/4 transition-colors cursor-pointer"
    onClick={() => onSelect(ticket)}
  >
    <td className="px-4 py-3.5 text-xs font-mono text-violet-400">{ticket.ticketId}</td>
    <td className="px-4 py-3.5 max-w-[220px]">
      <p className="text-sm font-semibold text-textPrimary truncate">{ticket.subject}</p>
      <p className="text-[11px] text-textMuted">{ticket.category?.replace('_', ' ')}</p>
    </td>
    <td className="px-4 py-3.5">
      <div className="text-xs text-textPrimary font-medium">{ticket.user?.name || '—'}</div>
      <div className="text-[11px] text-textMuted truncate max-w-[140px]">{ticket.user?.email || ''}</div>
    </td>
    <td className="px-4 py-3.5">
      <StatusBadge status={ticket.status} />
    </td>
    <td className="px-4 py-3.5">
      <PriorityBadge priority={ticket.priority} />
    </td>
    <td className="px-4 py-3.5 text-xs text-textMuted">
      {ticket.responses?.length ?? 0}
    </td>
    <td className="px-4 py-3.5 text-xs text-textMuted">
      {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('en-IN') : '—'}
    </td>
    <td className="px-4 py-3.5">
      <ChevronRight className="w-4 h-4 text-textMuted" />
    </td>
  </tr>
);

// ── Mobile Ticket Card ─────────────────────────────────────────
const TicketCard = ({ ticket, onSelect, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.04 }}
    onClick={() => onSelect(ticket)}
    className="glass-card rounded-xl border border-white/8 p-4 cursor-pointer hover:border-violet-500/30 transition-all"
  >
    <div className="flex items-start justify-between gap-2 mb-2">
      <span className="text-[11px] font-mono text-violet-400">{ticket.ticketId}</span>
      <PriorityBadge priority={ticket.priority} />
    </div>
    <p className="text-sm font-semibold text-textPrimary mb-1 line-clamp-1">{ticket.subject}</p>
    <p className="text-[11px] text-textMuted mb-3">{ticket.user?.name} · {ticket.category?.replace('_', ' ')}</p>
    <div className="flex items-center justify-between">
      <StatusBadge status={ticket.status} />
      <span className="text-[11px] text-textMuted">
        {ticket.responses?.length ?? 0} replies · {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('en-IN') : '—'}
      </span>
    </div>
  </motion.div>
);

// ── Ticket Detail Drawer ───────────────────────────────────────
const TicketDrawer = ({ ticketId, onClose }) => {
  const [replyText, setReplyText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const messagesEndRef = useRef(null);

  const { data, isLoading } = useSupportTicketById(ticketId);
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateTicketStatus();
  const { mutate: sendReply, isPending: isSendingReply } = useReplyTicket();
  const queryClient = useQueryClient();

  const ticket = data?.data;

  useEffect(() => {
    if (ticket) setSelectedStatus(ticket.status);
  }, [ticket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.responses?.length]);

  const handleStatusChange = (newStatus) => {
    if (!ticket || newStatus === ticket.status) return;
    updateStatus(
      { id: ticket._id, status: newStatus },
      {
        onSuccess: () => {
          toast.success(`Ticket status updated to "${newStatus}"`);
          queryClient.invalidateQueries({ queryKey: ['superadmin', 'support-tickets'] });
        },
        onError: () => toast.error('Failed to update status'),
      }
    );
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !ticket) return;
    sendReply(
      { id: ticket._id, message: replyText.trim() },
      {
        onSuccess: () => {
          toast.success('Reply sent!');
          setReplyText('');
          queryClient.invalidateQueries({ queryKey: ['superadmin', 'support-tickets', 'detail', ticket._id] });
        },
        onError: () => toast.error('Failed to send reply'),
      }
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 280 }}
          className="w-full max-w-xl h-full flex flex-col bg-[#0f1224] border-l border-white/8 overflow-hidden"
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
            <div>
              <h2 className="text-sm font-bold text-textPrimary">Ticket Detail</h2>
              {ticket && <p className="text-xs font-mono text-violet-400 mt-0.5">{ticket.ticketId}</p>}
            </div>
            <button
              id="ticket-drawer-close"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 text-textMuted transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {isLoading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-violet-500/40 border-t-violet-500 rounded-full animate-spin" />
            </div>
          )}

          {ticket && (
            <>
              {/* Ticket Meta */}
              <div className="px-5 py-4 border-b border-white/8 space-y-3 shrink-0">
                <h3 className="text-sm font-semibold text-textPrimary">{ticket.subject}</h3>
                <p className="text-xs text-textSecondary leading-relaxed">{ticket.description}</p>

                <div className="flex flex-wrap gap-3 text-xs text-textMuted">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3 h-3" />
                    {ticket.user?.name || '—'} ({ticket.user?.role || '—'})
                  </span>
                  {ticket.laundryId && (
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3 h-3" />
                      {ticket.laundryId?.name || '—'}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3 h-3" />
                    {ticket.category?.replace('_', ' ')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {new Date(ticket.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                </div>

                {/* Status Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-textMuted font-medium">Change Status:</span>
                  <div className="relative">
                    <select
                      id="ticket-status-select"
                      value={selectedStatus}
                      onChange={(e) => {
                        setSelectedStatus(e.target.value);
                        handleStatusChange(e.target.value);
                      }}
                      disabled={isUpdatingStatus}
                      className="appearance-none pl-3 pr-7 py-1.5 text-xs text-textPrimary bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/40 cursor-pointer disabled:opacity-50"
                    >
                      {STATUSES.filter((s) => s.value).map((s) => (
                        <option key={s.value} value={s.value} className="bg-[#0f1224]">
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-textMuted pointer-events-none" />
                  </div>
                  {isUpdatingStatus && (
                    <span className="text-[11px] text-amber-400 animate-pulse">Updating…</span>
                  )}
                </div>
              </div>

              {/* Conversation Thread */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {ticket.responses?.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                    <MessageSquare className="w-8 h-8 text-textMuted/40" />
                    <p className="text-xs text-textMuted">No replies yet. Start the conversation.</p>
                  </div>
                )}
                {ticket.responses?.map((resp, i) => {
                  const isSuperAdmin = resp.sender?.role === 'superadmin';
                  return (
                    <div key={resp._id || i} className={`flex ${isSuperAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-xl p-3 ${
                          isSuperAdmin
                            ? 'bg-violet-600/20 border border-violet-500/20'
                            : 'bg-white/5 border border-white/8'
                        }`}
                      >
                        <p className="text-xs text-textSecondary leading-relaxed">{resp.message}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className={`text-[10px] font-semibold ${isSuperAdmin ? 'text-violet-400' : 'text-textMuted'}`}>
                            {resp.sender?.name || 'User'}
                          </span>
                          <span className="text-[10px] text-textMuted">
                            · {new Date(resp.timestamp).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input */}
              {ticket.status !== 'closed' && (
                <div className="px-5 py-4 border-t border-white/8 shrink-0">
                  <div className="flex gap-2">
                    <textarea
                      id="ticket-reply-input"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply();
                        }
                      }}
                      placeholder="Type your reply… (Enter to send, Shift+Enter for newline)"
                      rows={3}
                      className="flex-1 resize-none px-3 py-2.5 text-sm text-textPrimary bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all placeholder:text-textMuted"
                    />
                    <button
                      id="ticket-reply-send"
                      onClick={handleSendReply}
                      disabled={!replyText.trim() || isSendingReply}
                      className="self-end px-3 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              {ticket.status === 'closed' && (
                <div className="px-5 py-3 border-t border-white/8 text-center">
                  <p className="text-xs text-textMuted">This ticket is closed. Reopen it to reply.</p>
                </div>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ── Table Skeleton ─────────────────────────────────────────────
const TableSkeleton = () => (
  <tbody>
    {Array.from({ length: 8 }).map((_, i) => (
      <tr key={i} className="border-b border-white/4">
        {Array.from({ length: 8 }).map((__, j) => (
          <td key={j} className="px-4 py-4">
            <div className="h-3 bg-white/8 rounded animate-pulse" style={{ width: `${50 + (i * 7 + j * 11) % 40}%` }} />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

// ── Main Support Page ──────────────────────────────────────────
export const Support = () => {
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [debouncedFilters, setDebouncedFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  const debounceTimer = useRef(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedFilters(filters);
      setPage(1);
    }, 380);
    return () => clearTimeout(debounceTimer.current);
  }, [filters]);

  const queryParams = {
    page,
    limit: LIMIT,
    ...(debouncedFilters.search && { search: debouncedFilters.search }),
    ...(debouncedFilters.status && { status: debouncedFilters.status }),
    ...(debouncedFilters.priority && { priority: debouncedFilters.priority }),
    ...(debouncedFilters.category && { category: debouncedFilters.category }),
  };

  const { data, isLoading, isError, error, isFetching, refetch } = useSupportTickets(queryParams);

  const tickets = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.pages || 1;
  const stats = data?.stats || {};

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['superadmin', 'support-tickets'] });
    toast.success('Tickets refreshed.');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="glass-card rounded-2xl border border-white/8 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/20 flex items-center justify-center">
              <LifeBuoy className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-textPrimary">Support Tickets</h1>
              <p className="text-xs text-textSecondary">Manage platform helpdesk requests</p>
            </div>
          </div>
          <button
            id="support-refresh-btn"
            onClick={handleRefresh}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-textSecondary bg-white/5 hover:bg-white/10 border border-white/8 rounded-xl transition-all self-start sm:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats bar */}
        <div className="mt-4 pt-4 border-t border-white/6">
          <StatsBar stats={stats} loading={isLoading} />
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-2xl border border-white/8 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-textMuted" />
            <input
              id="support-search"
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search by subject, ticket ID, or user…"
              className="w-full pl-9 pr-3 py-2.5 text-sm text-textPrimary bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/40 transition-all placeholder:text-textMuted"
            />
          </div>

          {/* Status */}
          <select
            id="support-filter-status"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2.5 text-sm text-textPrimary bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/40 cursor-pointer"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value} className="bg-[#0f1224]">{s.label}</option>
            ))}
          </select>

          {/* Priority */}
          <select
            id="support-filter-priority"
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="px-3 py-2.5 text-sm text-textPrimary bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/40 cursor-pointer"
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value} className="bg-[#0f1224]">{p.label}</option>
            ))}
          </select>

          {/* Category */}
          <select
            id="support-filter-category"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="px-3 py-2.5 text-sm text-textPrimary bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/40 cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value} className="bg-[#0f1224]">{c.label}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              id="support-clear-filters"
              onClick={handleClearFilters}
              className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 transition-all"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card rounded-2xl border border-white/8 overflow-hidden"
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-white/6">
          <span className="text-xs font-semibold text-textPrimary">
            {isLoading ? (
              <span className="inline-block w-24 h-3 bg-white/8 rounded animate-pulse" />
            ) : (
              <>
                <span className="text-sky-400">{total}</span> ticket{total !== 1 ? 's' : ''}
              </>
            )}
          </span>
          {isFetching && !isLoading && (
            <span className="text-[10px] text-sky-400 animate-pulse">Updating…</span>
          )}
        </div>

        {/* Error */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <p className="text-sm font-semibold text-textPrimary">Unable to load tickets</p>
            <p className="text-xs text-textMuted">
              {error?.response?.status === 403
                ? 'Access denied. SuperAdmin session required.'
                : 'A server error occurred.'}
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 text-xs font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded-xl hover:bg-sky-500/20 transition-all"
            >
              Retry
            </button>
          </div>
        )}

        {/* Desktop table */}
        {!isError && (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/6 bg-white/3">
                  {['Ticket ID', 'Subject', 'User', 'Status', 'Priority', 'Replies', 'Created', ''].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-[11px] font-semibold text-textMuted uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              {isLoading ? (
                <TableSkeleton />
              ) : (
                <tbody>
                  {tickets.map((t) => (
                    <TicketRow key={t._id} ticket={t} onSelect={(tk) => setSelectedId(tk._id)} />
                  ))}
                </tbody>
              )}
            </table>
            {!isLoading && tickets.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <LifeBuoy className="w-10 h-10 text-textMuted/30" />
                <p className="text-sm text-textMuted font-medium">
                  {hasActiveFilters ? 'No tickets match your filters.' : 'No support tickets yet.'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="text-xs text-sky-400 underline underline-offset-2"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mobile cards */}
        {!isError && !isLoading && tickets.length > 0 && (
          <div className="md:hidden space-y-3 p-3 sm:p-4">
            {tickets.map((t, i) => (
              <TicketCard
                key={t._id}
                ticket={t}
                onSelect={(tk) => setSelectedId(tk._id)}
                index={i}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isError && !isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/6">
            <span className="text-xs text-textMuted">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-semibold text-textSecondary bg-white/5 border border-white/8 rounded-lg hover:bg-white/10 disabled:opacity-40 transition-all"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs font-semibold text-textSecondary bg-white/5 border border-white/8 rounded-lg hover:bg-white/10 disabled:opacity-40 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Ticket Detail Drawer */}
      {selectedId && (
        <TicketDrawer
          ticketId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </motion.div>
  );
};

export default Support;

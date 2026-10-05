import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { ROUTES } from '../../routes/routeConstants';

export const AdminCustomers = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  // Fetch Customers Aggregated for this Laundry
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['admin-customers', search],
    queryFn: () => adminApi.getCustomers({ search }),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-textPrimary">
            Customer Directory
          </h1>
          <p className="text-xs text-textMuted mt-1">
            Profiles, lifetime order volume, and contact metrics for your customer base
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-textMuted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, phone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-white/[0.04] border border-white/10 text-textPrimary placeholder-textMuted focus:outline-none focus:border-primaryPurple focus:ring-1 focus:ring-primaryPurple transition-all"
          />
        </div>
      </div>

      {/* Customers Table Container */}
      <div className="glass-card p-6">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-textMuted">Loading customer profiles...</div>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-textMuted/40 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-textPrimary">No Customers Found</h3>
            <p className="text-xs text-textMuted mt-1">
              {search
                ? 'No customer matched your search query.'
                : 'Customer profiles will appear here as orders are submitted.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/[0.07] text-[11px] font-semibold text-textMuted uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Customer Reference</th>
                  <th className="py-3 px-3 text-center">Total Orders</th>
                  <th className="py-3 px-3 text-right">Lifetime Spent</th>
                  <th className="py-3 px-3">Last Order</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-textSecondary">
                {customers.map((cust, idx) => {
                  const name = cust.name || cust.user?.name || `Customer #${idx + 1}`;
                  const customerRef = `#CUST-${(cust._id || '').slice(-6).toUpperCase()}`;
                  const orderCount = cust.totalOrders || cust.orderCount || 1;
                  const totalSpent = cust.totalSpent || cust.totalAmount || 0;
                  const lastOrderDate = cust.lastOrderDate || cust.createdAt;

                  return (
                    <tr
                      key={cust._id || idx}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-textPrimary flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primaryPurple/30 to-brandIndigo/20 border border-primaryPurple/30 text-purpleLight flex items-center justify-center font-bold text-xs shadow-inner">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <span>{name}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.04] text-textMuted border border-white/[0.08]">
                          {customerRef}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/[0.04] text-textPrimary border border-white/[0.08]">
                          {orderCount} {orderCount === 1 ? 'order' : 'orders'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right font-bold text-textPrimary">
                        ₹{Number(totalSpent).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-3 text-textMuted">
                        {lastOrderDate
                          ? new Date(lastOrderDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Recent'}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => navigate(`${ROUTES.ADMIN.ORDERS}?search=${encodeURIComponent(name)}`)}
                          className="px-3 py-1.5 text-xs font-semibold text-purpleLight hover:bg-primaryPurple/20 rounded-lg transition-colors border border-primaryPurple/30"
                        >
                          View Orders
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCustomers;

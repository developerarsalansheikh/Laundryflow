import { Users as UsersIcon } from 'lucide-react';

/**
 * UserHeader Component
 */
export const UserHeader = () => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/8 pb-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_0_20px_rgba(99,102,241,0.25)]">
          <UsersIcon className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-textPrimary tracking-tight">Users</h1>
          <p className="text-xs sm:text-sm text-textSecondary mt-0.5 max-w-xl">
            Manage users and access across the LaundryFlow platform.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserHeader;

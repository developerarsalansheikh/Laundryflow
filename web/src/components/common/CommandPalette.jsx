import { useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, LayoutDashboard, Store, ShoppingBag, Users, BarChart3, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import { ROUTES } from '../../routes/routeConstants';

/**
 * Quick navigation items for the command palette.
 */
const QUICK_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: ROUTES.SUPERADMIN.DASHBOARD },
  { icon: Store, label: 'Laundries', path: ROUTES.SUPERADMIN.LAUNDRIES },
  { icon: ShoppingBag, label: 'Orders', path: ROUTES.SUPERADMIN.ORDERS },
  { icon: Users, label: 'Users', path: ROUTES.SUPERADMIN.USERS },
  { icon: BarChart3, label: 'Analytics', path: ROUTES.SUPERADMIN.ANALYTICS },
  { icon: Settings, label: 'Settings', path: ROUTES.SUPERADMIN.SETTINGS },
];

/**
 * CommandPalette — modal search and navigation dialog.
 * Opened via Ctrl+K / ⌘K. UI foundation only — no backend search integration.
 */
export const CommandPalette = () => {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const close = useCallback(() => setCommandPaletteOpen(false), [setCommandPaletteOpen]);

  // Global keyboard shortcut: Ctrl+K / ⌘K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [close, setCommandPaletteOpen]);

  // Focus input when opened
  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  const handleNavigate = (path) => {
    navigate(path);
    close();
  };

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="palette-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />

          {/* Dialog */}
          <motion.div
            key="palette-dialog"
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.18 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            <div className="glass-dropdown rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-borderSubtle">
                <Search className="w-4 h-4 text-textMuted flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search pages, actions..."
                  className="flex-1 bg-transparent text-sm text-textPrimary placeholder:text-textMuted outline-none"
                />
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close command palette"
                  className="text-textMuted hover:text-textPrimary transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick navigation */}
              <div className="p-2">
                <p className="px-3 py-1.5 text-[10px] font-semibold text-textMuted uppercase tracking-wider">
                  Quick Navigation
                </p>
                {QUICK_ITEMS.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => handleNavigate(item.path)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-textSecondary hover:text-textPrimary hover:bg-cardBg transition-all duration-150 outline-none focus-visible:ring-1 focus-visible:ring-primaryPurple cursor-pointer"
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Footer hint */}
              <div className="flex items-center justify-end gap-3 px-4 py-2.5 border-t border-borderSubtle">
                <span className="text-[10px] text-textMuted">
                  <kbd className="px-1 py-0.5 rounded border border-borderSubtle font-mono">ESC</kbd>
                  {' '}to close
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;

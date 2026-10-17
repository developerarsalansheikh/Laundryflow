import { useState, useCallback, useEffect, useRef } from 'react';
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
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const close = useCallback(() => {
    setCommandPaletteOpen(false);
    setQuery('');
  }, [setCommandPaletteOpen]);

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

  const filteredItems = QUICK_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (filteredItems.length > 0) {
        handleNavigate(filteredItems[0].path);
      } else if (query.trim()) {
        handleNavigate(`/superadmin/orders?search=${encodeURIComponent(query.trim())}`);
      }
    }
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
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs"
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
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
                <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search pages, orders, stores, customers... (Press Enter)"
                  className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                />
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close command palette"
                  className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Items List */}
              <div className="p-2 max-h-72 overflow-y-auto">
                {query.trim() && (
                  <button
                    type="button"
                    onClick={() => handleNavigate(`/superadmin/orders?search=${encodeURIComponent(query.trim())}`)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left bg-blue-50/60 hover:bg-blue-50 text-blue-700 border border-blue-100 mb-1.5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Search className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-semibold">Search orders for &ldquo;{query.trim()}&rdquo;</span>
                    </div>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">Enter</span>
                  </button>
                )}

                <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {query ? 'Matched Pages' : 'Quick Navigation'}
                </p>

                {filteredItems.length === 0 && !query.trim() ? (
                  <p className="px-3 py-4 text-xs text-slate-400 text-center">No matching pages</p>
                ) : (
                  filteredItems.map((item) => (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => handleNavigate(item.path)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-all duration-150 outline-none cursor-pointer"
                    >
                      <item.icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-xs font-semibold">{item.label}</span>
                    </button>
                  ))
                )}
              </div>

              {/* Footer hint */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-slate-50/70">
                <span className="text-[10px] text-slate-400">Navigation & platform search</span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-white font-mono text-[9px]">ESC</kbd>
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

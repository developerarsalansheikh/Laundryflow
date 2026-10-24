import { Search } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

/**
 * SearchBar — clickable trigger that opens the Command Palette.
 * Also displays the ⌘K keyboard shortcut hint.
 */
export const SearchBar = () => {
  const { setCommandPaletteOpen } = useUIStore();

  return (
    <button
      type="button"
      onClick={() => setCommandPaletteOpen(true)}
      aria-label="Open search (Ctrl+K)"
      className="flex items-center gap-2 px-3 h-9 rounded-xl text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-50 border border-[#DDD5C7] transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-stone-900/10 cursor-pointer w-full max-w-xs shadow-2xs whitespace-nowrap flex-shrink-0"
    >
      <Search className="w-4 h-4 text-stone-400 flex-shrink-0" />
      <span className="text-xs sm:text-sm font-medium flex-1 text-left hidden sm:inline-block truncate whitespace-nowrap font-erode">
        Search orders, stores...
      </span>
      <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-stone-50 border border-[#DDD5C7] text-[10px] font-mono text-stone-500 shadow-2xs flex-shrink-0">
        ⌘K
      </kbd>
    </button>
  );
};

export default SearchBar;

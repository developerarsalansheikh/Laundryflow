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
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-textMuted hover:text-textSecondary bg-cardBg hover:bg-cardHover border border-borderSubtle hover:border-borderStrong transition-all duration-200 outline-none focus-visible:ring-1 focus-visible:ring-primaryPurple cursor-pointer w-full max-w-xs"
    >
      <Search className="w-4 h-4 flex-shrink-0" />
      <span className="text-sm flex-1 text-left hidden sm:block">Search anything...</span>
      <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-cardBg border border-borderSubtle text-[10px] font-mono text-textMuted">
        ⌘K
      </kbd>
    </button>
  );
};

export default SearchBar;

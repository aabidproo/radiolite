import { Search, RefreshCw } from "lucide-react";

interface SearchHeaderProps {
  search: string;
  setSearch: (value: string) => void;
  onSearch: (e: React.FormEvent) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function SearchHeader({ search, setSearch, onSearch, onRefresh, isLoading }: SearchHeaderProps) {
  return (
    <header className="search-header flex items-center gap-2">
      <form onSubmit={onSearch} className="search-form group flex-1">
        <Search size={22} className="search-icon" />
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search stations..." 
          className="search-input"
        />
      </form>
      <button 
        onClick={onRefresh}
        disabled={isLoading}
        className={`refresh-button ${isLoading ? 'loading' : ''}`}
        title="Refresh data & clear cache"
      >
        <RefreshCw size={20} />
      </button>
    </header>
  );
}

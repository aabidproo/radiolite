import { Search } from "lucide-react";

interface SearchHeaderProps {
  search: string;
  setSearch: (value: string) => void;
  onSearch: (e: React.FormEvent) => void;
}

export function SearchHeader({ search, setSearch, onSearch }: SearchHeaderProps) {
  return (
    <header className="search-header">
      <form onSubmit={onSearch} className="search-form group">
        <Search size={22} className="search-icon" />
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search stations..." 
          className="search-input"
        />
      </form>
    </header>
  );
}

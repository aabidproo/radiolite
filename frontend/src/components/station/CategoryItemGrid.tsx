interface Item {
  name: string;
  stationcount: number | string;
  searchType?: 'country' | 'language' | 'tag';
}

interface ItemGridProps {
  items: Item[];
  onSelect: (name: string, type?: 'country' | 'language' | 'tag') => void;
  loading?: boolean;
  showApprox?: boolean;
}

export function CategoryItemGrid({ items, onSelect, loading, showApprox }: ItemGridProps) {
  // Only show full loader if items are empty
  if (loading && items.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  const toTitleCase = (str: string) => {
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <>
      <div className="category-item-grid">
        {items.map((item) => (
          <div 
            key={`${item.searchType || 'cat'}-${item.name}`} 
            className="category-item"
            onClick={() => onSelect(item.name, item.searchType)}
          >
            <div className="flex flex-col w-full gap-1">
              <span className="category-item-name">{toTitleCase(item.name)}</span>
              {item.searchType && (
                <div className="flex">
                  <span className="category-badge">
                    {item.searchType === 'tag' ? 'Genre' : item.searchType.charAt(0).toUpperCase() + item.searchType.slice(1)}
                  </span>
                </div>
              )}
            </div>
            <span className="category-item-count">
              {showApprox ? '~' : ''}
              {typeof item.stationcount === 'number' 
                ? item.stationcount.toLocaleString() 
                : item.stationcount} stations
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

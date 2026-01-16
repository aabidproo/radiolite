interface Item {
  name: string;
  stationcount: number;
}

interface ItemGridProps {
  items: Item[];
  onSelect: (name: string) => void;
  loading?: boolean;
}

export function CategoryItemGrid({ items, onSelect, loading }: ItemGridProps) {
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="category-item-grid">
      {items.map((item) => (
        <div 
          key={item.name} 
          className="category-item"
          onClick={() => onSelect(item.name)}
        >
          <span className="category-item-name">{item.name}</span>
          <span className="category-item-count">
            {item.stationcount.toLocaleString()} stations
          </span>
        </div>
      ))}
    </div>
  );
}

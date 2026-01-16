interface MainTabsProps {
  activeTab: 'explore' | 'favorites' | 'nearMe';
  setActiveTab: (tab: 'explore' | 'favorites' | 'nearMe') => void;
  favoritesCount: number;
}

export function MainTabs({ activeTab, setActiveTab, favoritesCount }: MainTabsProps) {
  return (
    <div className="chip-tabs-container">
      <div 
        className={`chip-tab ${activeTab === 'explore' ? 'active' : ''}`}
        onClick={() => setActiveTab('explore')}
      >
        Explore
      </div>
      <div 
        className={`chip-tab ${activeTab === 'nearMe' ? 'active' : ''}`}
        onClick={() => setActiveTab('nearMe')}
      >
        Near Me
      </div>
      <div 
        className={`chip-tab ${activeTab === 'favorites' ? 'active' : ''}`}
        onClick={() => setActiveTab('favorites')}
      >
        Favorites {favoritesCount > 0 && `(${favoritesCount})`}
      </div>
    </div>
  );
}

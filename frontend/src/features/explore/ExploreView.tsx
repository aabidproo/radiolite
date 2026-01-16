import { CategoryItemGrid } from "../../components/station/CategoryItemGrid";
import { StationGroupList } from "../../components/station/StationGroupList";
import { StationList } from "../../components/station/StationList";

interface ExploreViewProps {
  exploreView: 'categories' | 'countries' | 'languages' | 'tags';
  setExploreView: (view: 'categories' | 'countries' | 'languages' | 'tags') => void;
  selectedCountry: string | null;
  setSelectedCountry: (val: string | null) => void;
  selectedLanguage: string | null;
  setSelectedLanguage: (val: string | null) => void;
  selectedTag: string | null;
  setSelectedTag: (val: string | null) => void;
  countries: any[];
  languages: any[];
  tags: any[];
  stations: any[];
  loading: boolean;
  currentStation: any;
  playStation: (station: any) => void;
  hasMore: boolean;
  onLoadMoreStations: () => void;
  onLoadMoreCategories: () => void;
  handleSelectItem: (type: 'country' | 'language' | 'tag', value: string) => void;
  stats: { countries: number, languages: number, tags: number, stations: number } | null;
}

export function ExploreView({
  exploreView,
  setExploreView,
  selectedCountry,
  setSelectedCountry,
  selectedLanguage,
  setSelectedLanguage,
  selectedTag,
  setSelectedTag,
  countries,
  languages,
  tags,
  stations,
  loading,
  currentStation,
  playStation,
  hasMore,
  onLoadMoreStations,
  onLoadMoreCategories,
  handleSelectItem,
  stats
}: ExploreViewProps) {
  const isFiltered = selectedCountry || selectedLanguage || selectedTag;

  if (isFiltered) {
    return (
      <div key="explore-filtered" className="mt-4">
        <div className="px-4 mb-4">
          <div 
            className="text-accent text-sm cursor-pointer flex items-center gap-2"
            onClick={() => {
              setSelectedCountry(null);
              setSelectedLanguage(null);
              setSelectedTag(null);
            }}
          >
            ← Back to {selectedCountry ? 'countries' : selectedLanguage ? 'languages' : 'genres'}
          </div>
        </div>
        {selectedCountry ? (
          <StationGroupList 
            stations={stations}
            loading={loading}
            currentStation={currentStation}
            onPlay={playStation}
          />
        ) : (
          <StationList 
            stations={stations}
            title={`${(selectedLanguage || selectedTag || '').charAt(0).toUpperCase() + (selectedLanguage || selectedTag || '').slice(1)} Stations`}
            loading={loading}
            currentStation={currentStation}
            onPlay={playStation}
          />
        )}
        
        {hasMore && stations.length >= 100 && (
          <div className="load-more-container">
            <button 
              disabled={loading}
              className="load-more-btn"
              onClick={onLoadMoreStations}
            >
              {loading ? <div className="loading-spinner sm" /> : 'Load More Stations'}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (exploreView === 'categories') {
    return (
      <div key="categories-landing" className="mt-4">
        <h2 className="section-title px-4 mb-4">Browse by Category</h2>
        <div className="explore-grid">
          <div className="explore-card" onClick={() => setExploreView('countries')}>
            <span className="explore-card-title">By Country</span>
            <span className="explore-card-subtitle">{stats ? stats.countries.toLocaleString() : countries.length || '...'} Nations</span>
          </div>
          <div className="explore-card" onClick={() => setExploreView('languages')}>
            <span className="explore-card-title">By Language</span>
            <span className="explore-card-subtitle">{stats ? stats.languages.toLocaleString() : languages.length || '...'} Tongues</span>
          </div>
          <div className="explore-card" onClick={() => setExploreView('tags')}>
            <span className="explore-card-title">By Genre</span>
            <span className="explore-card-subtitle">{stats ? stats.tags.toLocaleString() : tags.length || '...'} Styles</span>
          </div>
        </div>
      </div>
    );
  }

  const categoryItems = 
    exploreView === 'countries' ? countries :
    exploreView === 'languages' ? languages :
    tags;

  const categoryType = 
    exploreView === 'countries' ? 'country' :
    exploreView === 'languages' ? 'language' :
    'tag';

  return (
    <div key="explore-category-list" className="mt-4 pb-8">
      <div className="px-4 mb-4">
        <div 
          className="text-accent text-sm cursor-pointer flex items-center gap-2"
          onClick={() => setExploreView('categories')}
        >
          ← Back to explore
        </div>
      </div>
      <h2 className="section-title px-4 mb-4">
        Browse by {exploreView === 'countries' ? 'Country' : exploreView === 'languages' ? 'Language' : 'Genre'}
      </h2>
      
      <CategoryItemGrid 
        items={categoryItems}
        onSelect={(val: string) => handleSelectItem(categoryType, val)}
        loading={loading}
        showApprox
      />

      {categoryItems.length > 0 && categoryItems.length % 24 === 0 && (
        <div className="load-more-container">
          <button 
            disabled={loading}
            className="load-more-btn"
            onClick={onLoadMoreCategories}
          >
            {loading ? <div className="loading-spinner sm" /> : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}

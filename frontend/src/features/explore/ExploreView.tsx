import { useState } from "react";
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
  featuredStations: any[];
  getFeaturedStations: (region?: string) => void;
  featuredLoading: boolean;
  categoriesLoading?: boolean;
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
  stats,
  featuredStations,
  getFeaturedStations,
  featuredLoading,
  categoriesLoading
}: ExploreViewProps) {
  const isFiltered = selectedCountry || selectedLanguage || selectedTag;
  const [activeRegion, setActiveRegion] = useState<string | null>(null);

  // Fetch when region changes
  const handleRegionSelect = (region: string) => {
    setActiveRegion(region);
    getFeaturedStations(region);
  };

  const handleBackToRegions = () => {
    setActiveRegion(null);
  }

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
      <div key="categories-landing" className="mt-5">
        {/* Popular Stations Section (Top) */}
        <div className="mb-8">
          <div className="flex items-center justify-between px-4 mb-2">
            <h2 className="section-title mb-0 text-[#1db954] leading-none">Popular Stations</h2>
            {activeRegion && (
              <span 
                className="text-accent text-sm font-medium cursor-pointer hover:underline leading-none"
                onClick={handleBackToRegions}
              >
                Show All Regions
              </span>
            )}
          </div>
          
          {!activeRegion ? (
            /* Region Cards Grid */
            <div className="explore-grid">
              <div className="explore-card" onClick={() => handleRegionSelect('Asia')}>
                <span className="explore-card-title">Asia</span>
                <span className="explore-card-subtitle">Curated Stations</span>
              </div>
              <div className="explore-card" onClick={() => handleRegionSelect('Europe')}>
                <span className="explore-card-title">Europe</span>
                <span className="explore-card-subtitle">Curated Stations</span>
              </div>
              <div className="explore-card" onClick={() => handleRegionSelect('North America')}>
                <span className="explore-card-title">North America</span>
                <span className="explore-card-subtitle">Curated Stations</span>
              </div>
              <div className="explore-card" onClick={() => handleRegionSelect('South America')}>
                <span className="explore-card-title">South America</span>
                <span className="explore-card-subtitle">Curated Stations</span>
              </div>
              <div className="explore-card" onClick={() => handleRegionSelect('Africa')}>
                <span className="explore-card-title">Africa</span>
                <span className="explore-card-subtitle">Curated Stations</span>
              </div>
              <div className="explore-card" onClick={() => handleRegionSelect('Oceania')}>
                <span className="explore-card-title">Oceania</span>
                <span className="explore-card-subtitle">Curated Stations</span>
              </div>
              <div className="explore-card" onClick={() => handleRegionSelect('Arab World')}>
                <span className="explore-card-title">Arab World</span>
                <span className="explore-card-subtitle">Curated Stations</span>
              </div>
            </div>
          ) : (
            /* Selected Region View */
            <div className="animate-fade-in"> 
               <div className="px-4 mb-4">
                 <h3 className="text-xl font-medium text-white mb-0" style={{ lineHeight: '0.9' }}>{activeRegion}</h3>
                 <p className="metadata" style={{ fontSize: '11px', color: '#B3B3B3', marginTop: '-10px', lineHeight: '1.2' }}>
                    {activeRegion === 'Asia' && "From Mumbai to Tokyo, tune into the pulse of the continent."}
                    {activeRegion === 'Europe' && "Icons of global radio. BBC, RTÉ, and more defining voices."}
                     {activeRegion === 'North America' && "Broadcasting giants from the US, Canada, and Mexico."}
                     {activeRegion === 'South America' && "Vibrant rhythms from Brazil, Argentina, and beyond."}
                     {activeRegion === 'Africa' && "Rhythms from Lagos to Cape Town. The soul of Africa."}
                     {activeRegion === 'Oceania' && "Voices from Australia, NZ, and the Pacific Islands."}
                     {activeRegion === 'Arab World' && "Middle East & North Africa. MBC, Rotana, and more."}
                 </p>
               </div>
               
               {featuredLoading ? (
                  <div className="loading-container">
                    <div className="loading-spinner sm" />
                  </div>
                ) : (
                  <StationList 
                    title=""
                    stations={featuredStations}
                    onPlay={(s: any) => playStation(s)}
                    currentStation={currentStation}
                  />
                )}
            </div>
          )}
        </div>

        {!activeRegion && (
          <div className="mb-4">
            <div className="flex items-center justify-between px-4 mb-2">
              <h2 className="section-title mb-0 text-[#1db954] leading-none">Popular Genres</h2>
              {tags.length > 0 && (
                <span 
                  className="text-accent text-sm font-medium cursor-pointer hover:underline leading-none"
                  onClick={() => setExploreView('tags')}
                >
                  Show All
                </span>
              )}
            </div>
            <CategoryItemGrid 
              items={tags.slice(0, 8)}
              onSelect={(val: string) => handleSelectItem('tag', val)}
              loading={loading && tags.length === 0}
              showApprox
            />
          </div>
        )}

        {!activeRegion && (
          <div className="mb-4">
            <div className="flex items-center justify-between px-4 mb-2">
              <h2 className="section-title mb-0 leading-none">Browse by Category</h2>
            </div>
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
        )}
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
            disabled={categoriesLoading}
            className="load-more-btn"
            onClick={onLoadMoreCategories}
          >
            {categoriesLoading ? <div className="loading-spinner sm" /> : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}

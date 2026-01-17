import { CategoryItemGrid } from "../../components/station/CategoryItemGrid";
import { StationList } from "../../components/station/StationList";

interface GlobalSearchViewProps {
  loading: boolean;
  globalSearchResults: any;
  currentStation: any;
  playStation: (station: any) => void;
  stations: any[];
  hasMore: boolean;
  onLoadMoreStations: () => void;
  onSelectCategory: (type: 'country' | 'language' | 'tag', name: string) => void;
  onClearSearch: () => void;
}

export function GlobalSearchView({
  loading,
  globalSearchResults,
  currentStation,
  playStation,
  stations,
  hasMore,
  onLoadMoreStations,
  onSelectCategory,
  onClearSearch
}: GlobalSearchViewProps) {
  if (!globalSearchResults && !loading) return null;

  const totalResults = globalSearchResults
    ? (globalSearchResults.countries.length + 
       globalSearchResults.languages.length + 
       globalSearchResults.tags.length + 
       globalSearchResults.stations.length)
    : 0;

  const hasCategories = globalSearchResults && (
    globalSearchResults.countries.length > 0 || 
    globalSearchResults.languages.length > 0 || 
    globalSearchResults.tags.length > 0
  );

  return (
    <div key="search" className="mt-5 pb-12">
      {loading && !globalSearchResults && (
        <div className="loading-container">
          <div className="loading-spinner" />
        </div>
      )}
      
      {globalSearchResults && (
        <>
          {/* 1. Global Categories Matches */}
          {hasCategories && (
            <div className="mb-8">
              <div className="mb-4 flex justify-between items-center px-4">
                <h2 className="section-title">Matches</h2>
                <span className="text-accent text-sm font-medium">
                  {totalResults > 0 ? `${totalResults.toLocaleString()} results` : 'Search results'}
                </span>
              </div>
              
              <CategoryItemGrid 
                items={[
                  ...globalSearchResults.countries.map((c: any) => ({ ...c, searchType: 'country' })),
                  ...globalSearchResults.languages.map((l: any) => ({ ...l, searchType: 'language' })),
                  ...globalSearchResults.tags.map((t: any) => ({ ...t, searchType: 'tag' }))
                ] as any}
                showApprox
                onSelect={(name, type) => {
                  if (type) onSelectCategory(type, name);
                  onClearSearch();
                }}
              />
            </div>
          )}

          {/* 2. Station Results */}
          <div>
            <div className="mb-4 flex justify-between items-center px-4">
              <h3 className="section-title text-lg">Stations</h3>
            </div>
            <StationList 
              stations={stations.length > 0 ? stations : globalSearchResults.stations}
              title=""
              loading={loading}
              currentStation={currentStation}
              onPlay={playStation}
            />
            
            {hasMore && (
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
          
          {totalResults === 0 && !loading && (
            <div className="px-4 text-muted">No results found.</div>
          )}
        </>
      )}
    </div>
  );
}

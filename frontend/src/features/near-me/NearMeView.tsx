import { StationGroupList } from "../../components/station/StationGroupList";

interface NearMeViewProps {
  userCountry: string | null;
  stations: any[];
  nearMeStations: any[];
  loading: boolean;
  currentStation: any;
  playStation: (station: any) => void;
  hasMore: boolean;
  onLoadMore: () => void;
}

export function NearMeView({
  userCountry,
  stations,
  nearMeStations,
  loading,
  currentStation,
  playStation,
  hasMore,
  onLoadMore
}: NearMeViewProps) {
  return (
    <div key="nearMe" className="mt-4">
      <h2 className="section-title px-4 mb-2">
        Stations in {userCountry || 'your area'}
      </h2>
      <StationGroupList 
        stations={stations.length > 0 ? stations : nearMeStations}
        loading={loading}
        currentStation={currentStation}
        onPlay={playStation}
      />
      {hasMore && (stations.length >= 100 || nearMeStations.length >= 100) && (
        <div className="load-more-container">
          <button 
            disabled={loading}
            className="load-more-btn"
            onClick={onLoadMore}
          >
            {loading ? <div className="loading-spinner sm" /> : 'Load More Stations'}
          </button>
        </div>
      )}
    </div>
  );
}

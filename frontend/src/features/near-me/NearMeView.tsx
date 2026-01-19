import { StationGroupList } from "../../components/station/StationGroupList";

interface NearMeViewProps {
  userCountry: string | null;
  nearMeStations: any[];
  loading: boolean;
  currentStation: any;
  playStation: (station: any) => void;
  hasMore: boolean;
  onLoadMore: () => void;
  onDetectWithPermission: () => void;
}

export function NearMeView({
  userCountry,
  nearMeStations,
  loading,
  currentStation,
  playStation,
  hasMore,
  onLoadMore,
  onDetectWithPermission
}: NearMeViewProps) {
  return (
    <div key="nearMe" className="mt-5">
      <div className="flex items-center justify-between px-4 mb-2">
        <h2 className="section-title mb-0 leading-none">
          Stations in {userCountry || 'your area'}
        </h2>
        {!userCountry && !loading && (
          <button 
            onClick={onDetectWithPermission}
            className="chip-tab active ml-2 text-xs"
            style={{ display: 'inline-block', padding: '6px 12px' }}
          >
            Allow Location
          </button>
        )}
      </div>
      
      {!loading && nearMeStations.length === 0 && (
        <div className="px-4 py-12 text-center">
            <p className="text-white/60 mb-4">No local stations found.</p>
            <button 
              onClick={onDetectWithPermission}
              className="chip-tab active"
              style={{ display: 'inline-block', padding: '10px 24px' }}
            >
              Use My Current Location
            </button>
        </div>
      )}
      <StationGroupList 
        stations={nearMeStations}
        loading={loading}
        currentStation={currentStation}
        onPlay={playStation}
      />
      {hasMore && nearMeStations.length >= 100 && (
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

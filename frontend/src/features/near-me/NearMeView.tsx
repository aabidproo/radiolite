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
  userCountryCode: string | null;
}

export function NearMeView({
  userCountry,
  nearMeStations,
  loading,
  currentStation,
  playStation,
  hasMore,
  onLoadMore,
  onDetectWithPermission,
  userCountryCode
}: NearMeViewProps) {
  const hasLocation = userCountry || userCountryCode;

  return (
    <div key="nearMe" className="mt-5">
      <div className="flex items-center justify-between px-4 mb-2">
        <h2 className="section-title mb-0 leading-none">
          Stations in {userCountry || userCountryCode || 'your area'}
        </h2>
      </div>

      {/* Detecting location — show spinner, no prompt */}
      {loading && !hasLocation && (
        <div className="px-4 py-12 text-center">
          <div className="loading-spinner mb-4 mx-auto" />
          <p className="text-white/60">Detecting your location...</p>
        </div>
      )}

      {/* Failed to detect location after loading finished */}
      {!loading && !hasLocation && (
        <div className="px-4 py-12 text-center">
          <p className="text-white/60 mb-4">Couldn't detect your location automatically.</p>
          <p className="text-white/40 text-sm mb-6">
            This can happen if all IP lookup services are temporarily unavailable.
          </p>
          <button
            onClick={onDetectWithPermission}
            className="chip-tab active"
            style={{ display: 'inline-block', padding: '10px 24px' }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading stations after location is known */}
      {loading && nearMeStations.length === 0 && hasLocation && (
        <div className="px-4 py-12 text-center">
          <div className="loading-spinner mb-4 mx-auto" />
          <p className="text-white/60">Searching stations in {userCountry || userCountryCode}...</p>
        </div>
      )}

      {/* Stations loaded but empty result */}
      {!loading && nearMeStations.length === 0 && hasLocation && (
        <div className="px-4 py-12 text-center">
          <p className="text-white/60 mb-4">No local stations found in {userCountry || userCountryCode}.</p>
          <button
            onClick={onDetectWithPermission}
            className="chip-tab active"
            style={{ display: 'inline-block', padding: '10px 24px' }}
          >
            Retry
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

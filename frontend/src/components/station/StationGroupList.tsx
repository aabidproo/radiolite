import { useState } from 'react';
import { Station } from '../../types/station';
import { StationRow } from './StationRow';

interface StationGroupListProps {
  stations: Station[];
  loading?: boolean;
  currentStation: Station | null;
  onPlay: (s: Station) => void;
}

export function StationGroupList({ 
  stations, 
  loading, 
  currentStation, 
  onPlay
}: StationGroupListProps) {
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());

  if (loading && stations.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  // 1. Group by Place (City, State, Country)
  const grouped = stations.reduce((acc, station) => {
    // Collect non-empty components and deduplicate (case-insensitive)
    const rawComponents = [];
    if (station.city?.trim()) rawComponents.push(station.city.trim());
    if (station.state?.trim()) rawComponents.push(station.state.trim());
    
    // Only show country if no city or state is available
    if (rawComponents.length === 0 && station.country?.trim()) {
      rawComponents.push(station.country.trim());
    }

    // Deduplicate while preserving order
    const components: string[] = [];
    const seen = new Set<string>();
    for (const c of rawComponents) {
      const lower = c.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        components.push(c);
      }
    }

    let groupKey = components.join(', ');
    if (!groupKey) groupKey = 'Local Stations';
    
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(station);
    return acc;
  }, {} as Record<string, Station[]>);

  // 2. Sort Places
  const sortedPlaces = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  const toggleExpand = (place: string) => {
    setExpandedStates(prev => {
      const next = new Set(prev);
      if (next.has(place)) next.delete(place);
      else next.add(place);
      return next;
    });
  };

  return (
    <div className="station-group-list pb-4">
      {sortedPlaces.map(place => {
        const placeStations = grouped[place];
        const isExpanded = expandedStates.has(place);

        return (
          <div key={place} className="mb-1">
            <div 
              className={`place-group-header ${isExpanded ? 'expanded' : ''}`}
              onClick={() => toggleExpand(place)}
            >
              <div className="place-group-left">
                <span className="place-count-badge">
                  {placeStations.length}
                </span>
                <span className="place-group-name">{place}</span>
              </div>
              <div className="place-group-right">
                <span className={`toggle-icon ${isExpanded ? 'rotated' : ''}`}>
                  ›
                </span>
              </div>
            </div>
            
            {isExpanded && (
              <div className="station-group mt-1">
                {placeStations.map(station => (
                  <StationRow 
                    key={station.stationuuid} 
                    station={station} 
                    onPlay={onPlay} 
                    isActive={currentStation?.stationuuid === station.stationuuid}
                  />
                ))}
              </div>
            )}

            {isExpanded && placeStations.length > 5 && (
              <div 
                onClick={() => toggleExpand(place)}
                className="group-toggle-button"
              >
                Show Less
              </div>
            )}
          </div>
        );
      })}
      
      {stations.length === 0 && (
        <div className="text-center text-muted text-sm mt-12 py-8 px-4 flex flex-col gap-2">
          {loading ? (
            <>
              <div className="text-accent">Searching...</div>
              <div className="text-xs opacity-50">Connecting to global airwaves</div>
            </>
          ) : (
            <>
              <div className="text-white">No stations found</div>
              <div className="text-xs opacity-50">Try refining your search or filter</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

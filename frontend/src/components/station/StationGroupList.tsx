import { useState } from 'react';
import { Station } from '../../types/station';
import { StationRow } from './StationRow';
import { SectionTitle } from '../ui/Typography';

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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  // 1. Group by State or City
  const grouped = stations.reduce((acc, station) => {
    let groupKey = station.state;
    if (!groupKey || groupKey.trim() === '') {
      groupKey = station.city;
    }
    if (!groupKey || groupKey.trim() === '') {
      groupKey = 'Unknown Location';
    }
    
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(station);
    return acc;
  }, {} as Record<string, Station[]>);

  // 2. Sort States (Unknown Location last)
  const sortedStates = Object.keys(grouped).sort((a, b) => {
    if (a === 'Unknown Location') return 1;
    if (b === 'Unknown Location') return -1;
    return a.localeCompare(b);
  });

  const toggleExpand = (state: string) => {
    setExpandedStates(prev => {
      const next = new Set(prev);
      if (next.has(state)) next.delete(state);
      else next.add(state);
      return next;
    });
  };

  return (
    <div className="station-group-list pb-8">
      {sortedStates.map(state => {
        const stateStations = grouped[state];
        const isExpanded = expandedStates.has(state);
        const displayStations = isExpanded ? stateStations : stateStations.slice(0, 3);
        const hasMore = stateStations.length > 3;

        return (
          <div key={state} className="mb-6">
            <SectionTitle className="sticky top-0 bg-[#121212] py-2 z-10 border-b border-white/5 mx-4 mb-2">
              {state} <span className="text-muted text-[10px] ml-1">({stateStations.length})</span>
            </SectionTitle>
            
            <div className="station-group">
              {displayStations.map(station => (
                <StationRow 
                  key={station.stationuuid} 
                  station={station} 
                  onPlay={onPlay} 
                  isActive={currentStation?.stationuuid === station.stationuuid}
                />
              ))}
            </div>

            {hasMore && (
              <div 
                onClick={() => toggleExpand(state)}
                className="pl-4 mt-2 text-xs text-accent cursor-pointer hover:underline opacity-80 hover:opacity-100 transition-opacity"
              >
                {isExpanded ? 'Show Less' : `Show All (${stateStations.length})`}
              </div>
            )}
          </div>
        );
      })}
      
      {stations.length === 0 && !loading && (
        <div className="text-center text-muted text-sm mt-8">
          No stations found in this region.
        </div>
      )}
    </div>
  );
}

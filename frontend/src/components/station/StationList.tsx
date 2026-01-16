import { Station } from "../../types/station";
import { StationRow } from "./StationRow";
import { SectionTitle } from "../ui/Typography";

interface StationListProps {
  stations: Station[];
  title: string;
  loading?: boolean;
  currentStation: Station | null;
  onPlay: (s: Station) => void;
  accentTitle?: boolean;
}

export function StationList({ 
  stations, 
  title, 
  loading, 
  currentStation, 
  onPlay,
  accentTitle
}: StationListProps) {
  if (stations.length === 0 && !loading) return null;

  return (
    <div className="station-list-container">
      <SectionTitle className={`px-4 mb-2 ${accentTitle ? 'accent' : ''}`}>
        {title}
      </SectionTitle>
      
      {loading && stations.length === 0 ? (
        <div className="loading-container">
           <div className="loading-spinner" />
        </div>
      ) : (
        <div className="station-group">
          {stations.map(station => (
            <StationRow 
              key={station.stationuuid} 
              station={station} 
              onPlay={onPlay} 
              isActive={currentStation?.stationuuid === station.stationuuid}
            />
          ))}
        </div>
      )}
    </div>
  );
}

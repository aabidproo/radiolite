import { Station } from "../../types/station";
import { StationName, Metadata } from "../ui/Typography";

interface StationRowProps {
  station: Station;
  onPlay: (s: Station) => void;
  isActive: boolean;
}

export function StationRow({ station, onPlay, isActive }: StationRowProps) {
  return (
    <div 
      className="station-row group"
      onClick={() => onPlay(station)}
    >
      <StationName className={isActive ? 'active' : ''}>
        {station.name}
      </StationName>
      <Metadata>
        {station.country} {station.bitrate > 0 ? `• ${station.bitrate}KBPS` : ''}
      </Metadata>
    </div>
  );
}
